/**
 * Imp-09 SSE subscription helper (DR-P13-004=A).
 * No Supabase Realtime protocol — EventSource → reload callbacks.
 *
 * Chrome (~6 HTTP/1 connections per host) hangs when each RealtimeChannelShim
 * opens its own EventSource to /events. All subscribers share one connection;
 * events are multiplexed to every active handler.
 */
import { loadSession } from '@/services/session';
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl';

const apiUrl = resolveApiBaseUrl();

export type SseHandlers = {
  onEvent?: (type: string, data: unknown) => void;
  onError?: (err: unknown) => void;
};

export type SseSubscription = {
  close: () => void;
};

const DOMAIN_TYPES = [
  'period.created',
  'period.updated',
  'period.deleted',
  'declaration.submitted',
  'declaration.updated',
  'declaration.approved',
  'declaration.rejected',
  'declaration.cancelled',
  'queue.changed',
  'dashboard.changed',
] as const;

type Subscriber = {
  id: number;
  handlers: SseHandlers;
};

let nextSubscriberId = 1;
let sharedEs: EventSource | null = null;
let sharedToken: string | null = null;
let connectPromise: Promise<void> | null = null;
const subscribers = new Map<number, Subscriber>();

function emitEvent(type: string, ev: MessageEvent) {
  let parsed: unknown;
  let useParsed = true;
  try {
    parsed = ev.data ? JSON.parse(String(ev.data)) : null;
  } catch {
    useParsed = false;
    parsed = ev.data;
  }

  for (const { handlers } of subscribers.values()) {
    try {
      if (useParsed) {
        const data = parsed as { type?: string } | null;
        handlers.onEvent?.(type || data?.type || 'message', parsed);
      } else {
        handlers.onEvent?.(type || 'message', ev.data);
      }
    } catch {
      /* ignore subscriber errors */
    }
  }
}

function emitError(err: unknown) {
  for (const { handlers } of subscribers.values()) {
    try {
      handlers.onError?.(err);
    } catch {
      /* ignore */
    }
  }
}

function tearDownSharedEs() {
  if (!sharedEs) {
    sharedToken = null;
    return;
  }
  try {
    sharedEs.close();
  } catch {
    /* ignore */
  }
  sharedEs = null;
  sharedToken = null;
}

function attachSharedListeners(es: EventSource) {
  const forward = (type: string) => (ev: MessageEvent) => emitEvent(type, ev);

  es.addEventListener('connected', forward('connected'));
  es.onmessage = forward('message');
  for (const t of DOMAIN_TYPES) {
    es.addEventListener(t, forward(t));
  }
  es.onerror = (err) => {
    emitError(err);
  };
}

async function ensureSharedConnection(token: string): Promise<void> {
  if (
    sharedEs &&
    sharedToken === token &&
    sharedEs.readyState !== EventSource.CLOSED
  ) {
    return;
  }

  if (connectPromise) {
    await connectPromise;
    if (
      sharedEs &&
      sharedToken === token &&
      sharedEs.readyState !== EventSource.CLOSED
    ) {
      return;
    }
  }

  connectPromise = (async () => {
    tearDownSharedEs();

    if (typeof EventSource === 'undefined') {
      emitError(new Error('EventSource unavailable'));
      return;
    }

    const url = `${apiUrl}/events?access_token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    sharedEs = es;
    sharedToken = token;
    attachSharedListeners(es);
  })();

  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
}

function removeSubscriber(id: number) {
  subscribers.delete(id);
  if (subscribers.size === 0) {
    tearDownSharedEs();
  }
}

/**
 * Subscribe to GET /events (query token — EventSource cannot set Authorization).
 * Shares a single EventSource across all callers; close() drops this subscriber
 * and tears down the connection when the last one leaves.
 */
export async function subscribeEvents(handlers: SseHandlers = {}): Promise<SseSubscription> {
  const session = await loadSession();
  if (!session?.access_token) {
    return { close: () => undefined };
  }

  if (typeof EventSource === 'undefined') {
    handlers.onError?.(new Error('EventSource unavailable'));
    return { close: () => undefined };
  }

  const id = nextSubscriberId++;
  subscribers.set(id, { id, handlers });

  try {
    await ensureSharedConnection(session.access_token);
  } catch (err) {
    removeSubscriber(id);
    handlers.onError?.(err);
    return { close: () => undefined };
  }

  // Subscriber removed while connect was in flight (e.g. rapid unmount).
  if (!subscribers.has(id)) {
    return { close: () => undefined };
  }

  let closed = false;
  return {
    close: () => {
      if (closed) return;
      closed = true;
      removeSubscriber(id);
    },
  };
}
