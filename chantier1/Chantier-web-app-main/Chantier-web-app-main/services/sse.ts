/**
 * Imp-09 SSE subscription helper (DR-P13-004=A).
 * No Supabase Realtime protocol — EventSource → reload callbacks.
 */
import Constants from 'expo-constants';
import { loadSession } from '@/services/session';

const extra = Constants.expoConfig?.extra ?? {};
const apiUrl = (
  process.env.EXPO_PUBLIC_API_URL ||
  (extra as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

export type SseHandlers = {
  onEvent?: (type: string, data: unknown) => void;
  onError?: (err: unknown) => void;
};

export type SseSubscription = {
  close: () => void;
};

/**
 * Open GET /events with Bearer (query token fallback for EventSource).
 */
export async function subscribeEvents(handlers: SseHandlers = {}): Promise<SseSubscription> {
  const session = await loadSession();
  if (!session?.access_token) {
    return { close: () => undefined };
  }

  const url = `${apiUrl}/events?access_token=${encodeURIComponent(session.access_token)}`;

  if (typeof EventSource === 'undefined') {
    handlers.onError?.(new Error('EventSource unavailable'));
    return { close: () => undefined };
  }

  const es = new EventSource(url);

  const forward = (type: string) => (ev: MessageEvent) => {
    try {
      const data = ev.data ? JSON.parse(String(ev.data)) : null;
      handlers.onEvent?.(type || data?.type || 'message', data);
    } catch {
      handlers.onEvent?.(type || 'message', ev.data);
    }
  };

  es.addEventListener('connected', forward('connected'));
  es.onmessage = forward('message');
  const domainTypes = [
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
  ];
  for (const t of domainTypes) {
    es.addEventListener(t, forward(t));
  }

  es.onerror = (err) => {
    handlers.onError?.(err);
  };

  return {
    close: () => {
      try {
        es.close();
      } catch {
        /* ignore */
      }
    },
  };
}
