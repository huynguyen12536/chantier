/**
 * Diagnostic: can this Supabase project accept postgres_changes subscriptions?
 * Usage (from repo root, with .env loaded or env vars set):
 *   node scripts/check-realtime.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvFile();

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.error('[check-realtime] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(2);
}

let role = 'unknown';
try {
  role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role;
} catch {
  try {
    role = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString()).role;
  } catch {
    /* ignore */
  }
}

console.log('[check-realtime] url =', url);
console.log('[check-realtime] key.role =', role);

const sb = createClient(url, key, { auth: { persistSession: false } });

const periodes = await sb.from('periodes_travail').select('id').limit(1);
console.log(
  '[check-realtime] select periodes_travail =',
  periodes.error ? `ERR ${periodes.error.code} ${periodes.error.message}` : 'OK',
);

const decls = await sb.from('declarations_heures').select('id').limit(1);
console.log(
  '[check-realtime] select declarations_heures =',
  decls.error ? `ERR ${decls.error.code} ${decls.error.message}` : 'OK',
);

await new Promise((resolve) => {
  let finished = false;
  const done = (why) => {
    if (finished) return;
    finished = true;
    console.log('[check-realtime] finish =', why);
    resolve();
  };

  const channel = sb
    .channel(`rt-diag-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'periodes_travail' }, (payload) => {
      console.log('[check-realtime] EVENT periodes_travail', payload.eventType);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'declarations_heures' }, (payload) => {
      console.log('[check-realtime] EVENT declarations_heures', payload.eventType);
    })
    .subscribe((status, err) => {
      console.log('[check-realtime] channel_status =', status, err?.message || '');
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setTimeout(() => {
          void sb.removeChannel(channel);
          done(status);
        }, 2000);
      }
    });

  setTimeout(() => done('timeout'), 12000);
});
