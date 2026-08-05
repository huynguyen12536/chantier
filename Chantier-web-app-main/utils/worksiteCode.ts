import { supabase } from '@/services/supabase';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomPrefix(length = 3): string {
  let prefix = '';
  for (let i = 0; i < length; i++) {
    prefix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return prefix;
}

/** Extrait le numéro de séquence (3 chiffres) après `_` ou `-`. */
function parseWorksiteSequence(code: string): number | null {
  const match = code.match(/[_-](\d{3})$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

/** Génère un code chantier : préfixe aléatoire + `_` + numéro séquentiel sur 3 chiffres (ex. `XK7_004`). */
export async function generateWorksiteCode(): Promise<string> {
  const { data, error } = await supabase.from('chantiers').select('code');
  if (error) throw error;

  let maxSeq = 0;
  for (const row of data ?? []) {
    const seq = parseWorksiteSequence(row.code);
    if (seq !== null && seq > maxSeq) maxSeq = seq;
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${randomPrefix()}_${nextSeq}`;
}
