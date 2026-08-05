import { supabase } from '@/services/supabase';
import { normalizeDateKey } from '@/utils/date';
import { declarationLookupKey } from '@/utils/status';
import { timeRangesOverlap, toDbTimeString } from '@/utils/time';

export type ShiftOverlapPeriod = {
  id?: string;
  chantier_id: string;
  heure_debut: string | null;
  heure_fin: string | null;
  statut: string;
  date?: string;
};

export function buildDeclarationStatutMap(
  rows: { chantier_id: string; date: string; statut: string }[],
): Map<string, string> {
  const declByKey = new Map<string, string>();
  for (const row of rows) {
    declByKey.set(
      declarationLookupKey(row.chantier_id, normalizeDateKey(row.date)),
      row.statut,
    );
  }
  return declByKey;
}

/** Periods that still block time overlap (cancelled day/line ignored). */
export function filterActivePeriodsForShiftOverlap(
  periods: ShiftOverlapPeriod[],
  dateStr: string,
  declByKey: Map<string, string>,
): ShiftOverlapPeriod[] {
  return periods.filter((period) => {
    const dayKey = normalizeDateKey(period.date ?? dateStr);
    const declStatut = declByKey.get(declarationLookupKey(period.chantier_id, dayKey));
    if (declStatut === 'annulee') return false;
    if (period.statut === 'annulee') return false;
    if (!period.heure_debut || !period.heure_fin) return false;
    return true;
  });
}

export function shiftOverlapsActivePeriods(
  heureDebut: string,
  heureFin: string,
  periods: ShiftOverlapPeriod[],
): boolean {
  if (!heureDebut || !heureFin) return false;
  const dbDebut = toDbTimeString(heureDebut);
  const dbFin = toDbTimeString(heureFin);
  return periods.some((existing) => {
    if (!existing.heure_debut || !existing.heure_fin) return false;
    return timeRangesOverlap(dbDebut, dbFin, existing.heure_debut, existing.heure_fin);
  });
}

/**
 * Returns true if the proposed slot overlaps an existing shift on the same calendar day.
 */
export async function checkShiftOverlapForDate(
  userId: string,
  dateStr: string,
  heureDebut: string,
  heureFin: string,
  excludePeriodId?: string,
): Promise<boolean> {
  const [periodsRes, declRes] = await Promise.all([
    supabase
      .from('periodes_travail')
      .select('id, chantier_id, date, heure_debut, heure_fin, statut')
      .eq('user_id', userId)
      .eq('date', dateStr),
    supabase
      .from('declarations_heures')
      .select('chantier_id, date, statut')
      .eq('user_id', userId)
      .eq('date', dateStr),
  ]);

  if (periodsRes.error) throw periodsRes.error;
  if (declRes.error) throw declRes.error;

  const declByKey = buildDeclarationStatutMap(
    (declRes.data || []) as { chantier_id: string; date: string; statut: string }[],
  );

  const dayPeriods = ((periodsRes.data || []) as ShiftOverlapPeriod[]).filter(
    (p) => !excludePeriodId || p.id !== excludePeriodId,
  );

  const active = filterActivePeriodsForShiftOverlap(dayPeriods, dateStr, declByKey);
  return shiftOverlapsActivePeriods(heureDebut, heureFin, active);
}
