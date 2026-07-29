import { shiftOutsideChantierFrame } from '@/utils/time';

export type ChantierSource = 'standard' | 'divers';
export type ChantierDiversStatut = 'en_attente' | 'approuve' | 'rejete';

export function requiresFrameReason(params: {
  workDebut: string;
  workFin: string;
  chantierDebut?: string | null;
  chantierFin?: string | null;
  chantierSource?: ChantierSource | null;
  diversStatut?: ChantierDiversStatut | null;
}): boolean {
  if (
    params.chantierSource === 'divers'
    && params.diversStatut !== 'approuve'
  ) {
    return false;
  }

  return shiftOutsideChantierFrame(
    params.workDebut,
    params.workFin,
    params.chantierDebut,
    params.chantierFin,
  );
}

export function isPendingDiversChantier(
  source?: ChantierSource | null,
  diversStatut?: ChantierDiversStatut | null,
): boolean {
  if (diversStatut !== 'en_attente') return false;
  return source === 'divers' || source == null;
}

/** Shift validation (chef) and dashboard styling while worksite awaits admin approval. */
export function isBlockedByPendingDiversChantier(
  source?: ChantierSource | null,
  diversStatut?: ChantierDiversStatut | null,
): boolean {
  return isPendingDiversChantier(source, diversStatut);
}

/** Default attendance shift times on declare-day (not the site frame on pending divers). */
export const DEFAULT_SHIFT_START = '07:30';
export const DEFAULT_SHIFT_END = '16:45';

export function defaultShiftTimesForWorksite(params: {
  source?: ChantierSource | null;
  diversStatut?: ChantierDiversStatut | null;
  chantierDebut?: string | null;
  chantierFin?: string | null;
  formatChantierTime?: (dbTime: string) => string;
}): { debut: string; fin: string } {
  if (isPendingDiversChantier(params.source, params.diversStatut)) {
    return { debut: DEFAULT_SHIFT_START, fin: DEFAULT_SHIFT_END };
  }
  const fmt = params.formatChantierTime ?? ((t) => t);
  return {
    debut: params.chantierDebut ? fmt(params.chantierDebut) : DEFAULT_SHIFT_START,
    fin: params.chantierFin ? fmt(params.chantierFin) : DEFAULT_SHIFT_END,
  };
}
