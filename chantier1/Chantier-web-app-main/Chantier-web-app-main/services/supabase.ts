/**
 * Phase 13 Unified API client — replaces @supabase/supabase-js transport.
 * Speaks Imp-12 /rest/v1 + /auth/v1 + /functions/v1 + Imp-09 SSE (channel shim).
 */
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import {
  AuthSession,
  AuthUser,
  loadSession,
  saveSession,
} from '@/services/session';
import { subscribeEvents, SseSubscription } from '@/services/sse';
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl';

const extra = Constants.expoConfig?.extra ?? {};

export const apiUrl = resolveApiBaseUrl();

/** @deprecated Alias — Edge fetch historically used supabaseUrl */
export const supabaseUrl = apiUrl;

/** Ignored by Unified API; kept so existing Edge headers compile. */
export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_API_ANON_KEY ||
  (extra as { EXPO_PUBLIC_API_ANON_KEY?: string }).EXPO_PUBLIC_API_ANON_KEY ||
  'local-anon';

type Filter =
  | { kind: 'eq'; col: string; val: unknown }
  | { kind: 'neq'; col: string; val: unknown }
  | { kind: 'gte'; col: string; val: unknown }
  | { kind: 'lte'; col: string; val: unknown }
  | { kind: 'in'; col: string; vals: unknown[] }
  | { kind: 'is'; col: string; val: null }
  | { kind: 'not'; col: string; op: string; val: unknown }
  | { kind: 'or'; expr: string };

type AuthChangeCb = (event: string, session: AuthSession | null) => void;

const authListeners = new Set<AuthChangeCb>();

function notifyAuth(event: string, session: AuthSession | null) {
  for (const cb of authListeners) {
    try {
      cb(event, session);
    } catch {
      /* ignore */
    }
  }
}

function okResult<T = any>(data: T) {
  return { data, error: null as null };
}

function errResult(message: string, code?: string): { data: any; error: { message: string; code?: string } } {
  return { data: null, error: { message, code } };
}

/** Normalize Unified API / PostgREST-style error bodies to a user-facing string. */
export function apiErrorMessage(body: unknown, fallback = 'Request failed'): string {
  if (body == null) return fallback;
  if (typeof body === 'string' && body.trim()) return body;
  if (typeof body === 'object') {
    const err = (body as { error?: unknown; message?: unknown }).error;
    if (typeof err === 'string' && err.trim()) return err;
    if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

/** Extract message from thrown Error or supabase `{ message }` error objects. */
export function thrownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await loadSession();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    apikey: supabaseAnonKey,
  };
  if (session?.access_token) {
    headers.authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = {
    ...(await authHeaders()),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { res, body };
}

function detectEmbed(select: string): { embed: string; needsTree: boolean } {
  const s = select.replace(/\s+/g, ' ');
  const parts: string[] = [];
  if (/chantiers\s*\(/.test(s) || /chantiers\s*\*/.test(s) || s.includes('chantiers(*)')) {
    parts.push('chantiers');
  }
  if (/profiles\s*[!(]/.test(s) || s.includes('profiles(*)')) {
    parts.push('profiles');
  }
  if (/zones_chantiers/.test(s) || /zones_ouvriers/.test(s)) {
    return { embed: 'tree', needsTree: true };
  }
  return { embed: parts.join(','), needsTree: false };
}

function buildQueryParams(table: string, filters: Filter[], select: string): URLSearchParams {
  const qs = new URLSearchParams();
  const { embed, needsTree } = detectEmbed(select);
  if (needsTree) {
    qs.set('compose', 'tree');
    qs.set('embed', 'tree');
  } else if (embed) {
    qs.set('embed', embed);
  }

  const inVals: Record<string, unknown[]> = {};
  for (const f of filters) {
    if (f.kind === 'eq') {
      if (f.col === 'id' && table === 'profiles') {
        /* handled as path */
      } else if (f.col === 'id' && table === 'chantiers') {
        qs.set('id', String(f.val));
      } else if (['user_id', 'chantier_id', 'zone_id', 'date', 'statut', 'role', 'actif'].includes(f.col)) {
        qs.set(f.col, String(f.val));
      } else {
        qs.set(f.col, String(f.val));
      }
    } else if (f.kind === 'in') {
      inVals[f.col] = f.vals;
      if (f.col === 'chantier_id') qs.set('chantier_id_in', f.vals.map(String).join(','));
      else if (f.col === 'user_id') qs.set('user_id_in', f.vals.map(String).join(','));
      else if (f.col === 'id') qs.set('id_in', f.vals.map(String).join(','));
      else if (f.col === 'date') qs.set('date_in', f.vals.map(String).join(','));
      else if (f.col === 'statut') qs.set('statut_in', f.vals.map(String).join(','));
      else if (f.col === 'role') qs.set('role_in', f.vals.map(String).join(','));
    } else if (f.kind === 'gte' && f.col === 'date') {
      qs.set('date_gte', String(f.val));
    } else if (f.kind === 'lte' && f.col === 'date') {
      qs.set('date_lte', String(f.val));
    } else if (f.kind === 'neq' && f.col === 'statut') {
      qs.set('statut_neq', String(f.val));
    } else if (f.kind === 'is' && f.col === 'date_fin') {
      qs.set('date_fin_is', 'null');
    } else if (f.kind === 'not' && f.col === 'heure_fin' && f.op === 'is') {
      qs.set('heure_fin_not', 'null');
    }
  }
  return qs;
}

function applyLocalFilters<T extends Record<string, unknown>>(rows: T[], filters: Filter[]): T[] {
  let out = [...rows];
  const today = new Date().toISOString().split('T')[0];

  const asComparable = (col: string, value: unknown): string => {
    if (value == null) return '';
    const s = String(value);
    if (
      col === 'date' ||
      col === 'date_debut' ||
      col === 'date_fin' ||
      col.endsWith('_date')
    ) {
      return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
    }
    return s;
  };

  for (const f of filters) {
    if (f.kind === 'eq') {
      out = out.filter((r) => asComparable(f.col, r[f.col]) === asComparable(f.col, f.val));
    } else if (f.kind === 'neq') {
      out = out.filter((r) => asComparable(f.col, r[f.col]) !== asComparable(f.col, f.val));
    } else if (f.kind === 'gte') {
      out = out.filter(
        (r) => r[f.col] != null && asComparable(f.col, r[f.col]) >= asComparable(f.col, f.val),
      );
    } else if (f.kind === 'lte') {
      out = out.filter(
        (r) => r[f.col] != null && asComparable(f.col, r[f.col]) <= asComparable(f.col, f.val),
      );
    } else if (f.kind === 'in') {
      const set = new Set(f.vals.map((v) => asComparable(f.col, v)));
      out = out.filter((r) => set.has(asComparable(f.col, r[f.col])));
    } else if (f.kind === 'is') {
      out = out.filter((r) => r[f.col] == null);
    } else if (f.kind === 'not' && f.op === 'is') {
      out = out.filter((r) => r[f.col] != null);
    } else if (f.kind === 'or') {
      // date_fin.is.null,date_fin.gte.TODAY
      if (f.expr.includes('date_fin.is.null') && f.expr.includes('date_fin.gte.')) {
        out = out.filter(
          (r) => r.date_fin == null || asComparable('date_fin', r.date_fin) >= today,
        );
      } else if (f.expr.includes('ilike')) {
        const m = f.expr.match(/%([^%]+)%/);
        const needle = (m?.[1] || '').toLowerCase();
        if (needle) {
          out = out.filter((r) => {
            const nom = String(r.nom ?? '').toLowerCase();
            const prenom = String(r.prenom ?? '').toLowerCase();
            return nom.includes(needle) || prenom.includes(needle);
          });
        }
      }
    }
  }
  return out;
}

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private selectSpec = '*';
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private mutation:
    | { op: 'insert'; rows: unknown[]; preferSingle?: boolean }
    | { op: 'update'; patch: Record<string, unknown> }
    | { op: 'delete' }
    | { op: 'upsert'; rows: unknown[] }
    | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', _opts?: { count?: string }) {
    this.selectSpec = columns;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ kind: 'eq', col, val });
    return this;
  }
  neq(col: string, val: unknown) {
    this.filters.push({ kind: 'neq', col, val });
    return this;
  }
  gte(col: string, val: unknown) {
    this.filters.push({ kind: 'gte', col, val });
    return this;
  }
  lte(col: string, val: unknown) {
    this.filters.push({ kind: 'lte', col, val });
    return this;
  }
  in(col: string, vals: unknown[]) {
    this.filters.push({ kind: 'in', col, vals });
    return this;
  }
  is(col: string, val: null) {
    this.filters.push({ kind: 'is', col, val });
    return this;
  }
  not(col: string, op: string, val: unknown) {
    this.filters.push({ kind: 'not', col, op, val });
    return this;
  }
  or(expr: string) {
    this.filters.push({ kind: 'or', expr });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  insert(rows: unknown | unknown[]) {
    const list = Array.isArray(rows) ? rows : [rows];
    this.mutation = { op: 'insert', rows: list };
    return this;
  }

  upsert(rows: unknown | unknown[], _opts?: { onConflict?: string }) {
    // DR-P13-009=B — map upsert → POST assignUser (server ON CONFLICT)
    const list = Array.isArray(rows) ? rows : [rows];
    this.mutation = { op: 'upsert', rows: list };
    return this;
  }

  update(patch: Record<string, unknown>) {
    this.mutation = { op: 'update', patch };
    return this;
  }

  delete() {
    this.mutation = { op: 'delete' };
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      if (this.mutation?.op === 'insert' || this.mutation?.op === 'upsert') {
        return this.runInsert(this.mutation.rows);
      }
      if (this.mutation?.op === 'update') {
        return this.runUpdate(this.mutation.patch);
      }
      if (this.mutation?.op === 'delete') {
        return this.runDelete();
      }
      return this.runSelect();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return errResult(message);
    }
  }

  private finalize(rows: unknown[]) {
    let out = rows as Record<string, unknown>[];
    out = applyLocalFilters(out, this.filters);
    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.orderAsc;
      out.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return asc ? 1 : -1;
        if (bv == null) return asc ? -1 : 1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    if (this.wantSingle || this.wantMaybeSingle) {
      if (out.length === 0) {
        if (this.wantMaybeSingle) return okResult(null);
        return errResult('JSON object requested, multiple (or no) rows returned', 'PGRST116');
      }
      return okResult(out[0]);
    }
    return okResult(out);
  }

  private async runSelect() {
    // profiles by id → GET /profiles/:id (self/chef/admin)
    if (this.table === 'profiles') {
      const idEq = this.filters.find((f) => f.kind === 'eq' && f.col === 'id');
      if (idEq && idEq.kind === 'eq') {
        const { res, body } = await apiFetch(`/rest/v1/profiles/${idEq.val}`);
        if (!res.ok) {
          return errResult(apiErrorMessage(body, res.statusText));
        }
        return this.finalize(body ? [body as Record<string, unknown>] : []);
      }
    }

    const qs = buildQueryParams(this.table, this.filters, this.selectSpec);
    const path = `/rest/v1/${this.table}?${qs.toString()}`;
    const { res, body } = await apiFetch(path);
    if (!res.ok) {
      return errResult(apiErrorMessage(body, res.statusText));
    }
    const rows = Array.isArray(body) ? body : body ? [body] : [];
    return this.finalize(rows as Record<string, unknown>[]);
  }

  private async runInsert(rows: unknown[]) {
    const created: unknown[] = [];
    for (const row of rows) {
      const { res, body } = await apiFetch(`/rest/v1/${this.table}`, {
        method: 'POST',
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        return errResult(apiErrorMessage(body, res.statusText));
      }
      created.push(body);
    }
    if (this.wantSingle || this.wantMaybeSingle) {
      return okResult(created[0] ?? null);
    }
    return okResult(created);
  }

  private async runUpdate(patch: Record<string, unknown>) {
    const idEq = this.filters.find((f) => f.kind === 'eq' && f.col === 'id');

    // Bulk / filtered updates: select then patch each
    if (!idEq) {
      const sel = new QueryBuilder(this.table);
      sel.filters = [...this.filters];
      sel.selectSpec = 'id,user_id,chantier_id,zone_id,date,statut';
      const listed = await sel.runSelect();
      if (listed.error) return listed;
      const rows = (listed.data as Record<string, unknown>[] | null) || [];
      const updated: unknown[] = [];
      for (const row of rows) {
        if (this.table === 'zones_ouvriers') {
          const { res, body } = await apiFetch(`/rest/v1/zones_ouvriers`, {
            method: 'PATCH',
            body: JSON.stringify({
              zone_id: row.zone_id,
              user_id: row.user_id,
              ...patch,
            }),
          });
          if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
          updated.push(body);
          continue;
        }
        if (this.table === 'affectations_chantiers' && patch.chef_equipe_id !== undefined) {
          const { res, body } = await apiFetch(`/rest/v1/affectations_chantiers/${row.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              id: row.id,
              user_id: row.user_id,
              chantier_id: row.chantier_id,
              chef_equipe_id: patch.chef_equipe_id,
              date_debut: row.date_debut,
              date_fin: row.date_fin ?? null,
            }),
          });
          if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
          updated.push(body);
          continue;
        }
        if (this.table === 'affectations_chantiers' && patch.date_fin != null) {
          const { res, body } = await apiFetch(`/rest/v1/affectations_chantiers/${row.id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          });
          if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
          updated.push(body);
          continue;
        }
        if (!row.id) continue;
        const { res, body } = await apiFetch(`/rest/v1/${this.table}/${row.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
        updated.push(body);
      }
      if (this.wantSingle || this.wantMaybeSingle) {
        return okResult(updated[0] ?? null);
      }
      return okResult(updated);
    }

    const id = (idEq as { val: unknown }).val;
    const { res, body } = await apiFetch(`/rest/v1/${this.table}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...patch, id }),
    });
    if (!res.ok) {
      return errResult(apiErrorMessage(body, res.statusText));
    }
    if (this.wantSingle || this.wantMaybeSingle) {
      return okResult(body);
    }
    return okResult(Array.isArray(body) ? body : [body]);
  }

  private async runDelete() {
    const idEq = this.filters.find((f) => f.kind === 'eq' && f.col === 'id');
    if (this.table === 'zones_chantiers') {
      const zoneEq = this.filters.find((f) => f.kind === 'eq' && f.col === 'zone_id');
      const chantierEq = this.filters.find((f) => f.kind === 'eq' && f.col === 'chantier_id');
      const chantierIn = this.filters.find((f) => f.kind === 'in' && f.col === 'chantier_id');
      if (zoneEq && zoneEq.kind === 'eq' && chantierEq && chantierEq.kind === 'eq') {
        const { res, body } = await apiFetch(
          `/rest/v1/zones_chantiers/${zoneEq.val}/${chantierEq.val}`,
          { method: 'DELETE' },
        );
        if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
        return okResult(body);
      }
      if (zoneEq && zoneEq.kind === 'eq' && chantierIn && chantierIn.kind === 'in') {
        for (const cid of chantierIn.vals) {
          const { res, body } = await apiFetch(
            `/rest/v1/zones_chantiers/${zoneEq.val}/${cid}`,
            { method: 'DELETE' },
          );
          if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
        }
        return okResult(null);
      }
    }

    if (idEq && idEq.kind === 'eq') {
      const { res, body } = await apiFetch(`/rest/v1/${this.table}/${idEq.val}`, {
        method: 'DELETE',
      });
      if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
      return okResult(body);
    }

    // Filtered delete (periods): select then delete ids
    const sel = new QueryBuilder(this.table);
    sel.filters = [...this.filters];
    const listed = await sel.runSelect();
    if (listed.error) return listed;
    const rows = (listed.data as { id?: string }[] | null) || [];
    for (const row of rows) {
      if (!row.id) continue;
      const { res, body } = await apiFetch(`/rest/v1/${this.table}/${row.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) return errResult(apiErrorMessage(body, res.statusText));
    }
    return okResult(null);
  }
}

type ChannelHandlers = Array<(payload?: unknown) => void>;

class RealtimeChannelShim {
  name: string;
  private handlers: ChannelHandlers = [];
  private sub: SseSubscription | null = null;

  constructor(name: string) {
    this.name = name;
  }

  on(_event: string, _filter: unknown, cb: (payload?: unknown) => void) {
    this.handlers.push(cb);
    return this;
  }

  subscribe(cb?: (status: string, err?: Error) => void) {
    void (async () => {
      this.sub = await subscribeEvents({
        onEvent: () => {
          for (const h of this.handlers) {
            try {
              h({ eventType: '*' });
            } catch {
              /* ignore */
            }
          }
        },
        onError: (err) => cb?.('CHANNEL_ERROR', err instanceof Error ? err : new Error(String(err))),
      });
      cb?.('SUBSCRIBED');
    })();
    return this;
  }

  unsubscribe() {
    this.sub?.close();
    this.sub = null;
  }

  resubscribe() {
    if (this.handlers.length === 0) return;
    this.unsubscribe();
    this.subscribe();
  }
}

const channels = new Map<string, RealtimeChannelShim>();

const authApi = {
  async getSession() {
    const session = await loadSession();
    return okResult({ session });
  },

  onAuthStateChange(cb: AuthChangeCb) {
    authListeners.add(cb);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(cb);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { res, body } = await apiFetch(`/auth/v1/token?grant_type=password`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return errResult(apiErrorMessage(body, 'Invalid login'));
    }
    const session = body as AuthSession;
    await saveSession(session);
    notifyAuth('SIGNED_IN', session);
    return okResult({ session, user: session.user });
  },

  async signOut(_opts?: { scope?: string }) {
    const current = await loadSession();
    if (current?.refresh_token) {
      try {
        await apiFetch(`/auth/v1/logout`, {
          method: 'POST',
          body: JSON.stringify({ refresh_token: current.refresh_token }),
        });
      } catch {
        /* local clear still */
      }
    }
    await saveSession(null);
    notifyAuth('SIGNED_OUT', null);
    return okResult(null);
  },

  async getUser() {
    const { res, body } = await apiFetch(`/auth/v1/user`);
    if (!res.ok) {
      return errResult(apiErrorMessage(body, 'Unauthorized'));
    }
    const user = (body as { user: AuthUser }).user;
    return okResult({ user });
  },
};

export const supabase = {
  auth: authApi,
  from(table: string): any {
    return new QueryBuilder(table);
  },
  rpc(fn: string, args: Record<string, unknown> = {}): any {
    return (async () => {
      const supported = [
        'delete_chantier_cascade',
        'create_chantier_divers',
        'approve_chantier_divers',
        'reject_chantier_divers',
        'get_collaborator_divers_notifications',
      ];
      if (supported.includes(fn)) {
        const { res, body } = await apiFetch(`/rest/v1/rpc/${fn}`, {
          method: 'POST',
          body: JSON.stringify(args),
        });
        if (!res.ok) {
          return errResult(apiErrorMessage(body, res.statusText));
        }
        return okResult(body);
      }
      return errResult(`RPC not supported locally: ${fn}`);
    })();
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(
          path: string,
          body: ArrayBuffer | Blob | Buffer,
          opts?: { contentType?: string; upsert?: boolean },
        ) {
          const headers = await authHeaders();
          const contentType = opts?.contentType ?? 'application/octet-stream';
          delete headers['content-type'];
          const res = await fetch(`${apiUrl}/api/storage/${bucket}/${path.replace(/^\//, '')}`, {
            method: 'PUT',
            headers: {
              ...headers,
              'content-type': contentType,
            },
            body: body as BodyInit,
          });
          if (!res.ok) {
            const text = await res.text();
            let parsed: unknown = text;
            try {
              parsed = JSON.parse(text);
            } catch {
              /* raw */
            }
            return errResult(apiErrorMessage(parsed, 'Upload failed'));
          }
          const data = await res.json().catch(() => ({ path }));
          return okResult(data);
        },
        async remove(paths: string[]) {
          for (const p of paths) {
            const headers = await authHeaders();
            delete headers['content-type'];
            const res = await fetch(`${apiUrl}/api/storage/${bucket}/${p.replace(/^\//, '')}`, {
              method: 'DELETE',
              headers,
            });
            if (!res.ok && res.status !== 404) {
              const text = await res.text();
              let parsed: unknown = text;
              try {
                parsed = JSON.parse(text);
              } catch {
                /* raw */
              }
              return errResult(apiErrorMessage(parsed, 'Delete failed'));
            }
          }
          return okResult(null);
        },
      };
    },
  },
  channel(name: string) {
    const existing = channels.get(name);
    if (existing) return existing;
    const ch = new RealtimeChannelShim(name);
    channels.set(name, ch);
    return ch;
  },
  removeChannel(channel: RealtimeChannelShim) {
    channel.unsubscribe();
    channels.delete(channel.name);
  },
};

export type { AuthSession, AuthUser };

/** Reconnect SSE channels when JWT changes (Unified API equivalent of realtime.setAuth). */
export function bindRealtimeAuth(_accessToken: string | undefined | null) {
  for (const ch of channels.values()) {
    ch.unsubscribe();
    ch.resubscribe();
  }
}
