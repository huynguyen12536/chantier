/**
 * TimeUtilityService — replaces minutes_from_time + calculer_duree_periode (CVL).
 * No SQL business logic.
 */

export function minutesFromTime(t) {
  if (t == null || t === '') return null;
  const s = String(t).slice(0, 8);
  const [hh, mm] = s.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

/** Hours between debut and fin; 0 if fin null or fin <= debut. */
export function durationHours(heureDebut, heureFin) {
  const a = minutesFromTime(heureDebut);
  const b = minutesFromTime(heureFin);
  if (a == null || b == null || b <= a) return 0;
  return Math.round(((b - a) / 60) * 100) / 100;
}
