/**
 * TimesheetCalculationService — DR-IMP06-002 CADRE with 7h fallback.
 * Replaces calculer_heures_cadre_chantier + synthese view business math.
 */
import { durationHours, minutesFromTime } from './timeUtility.js';

const FALLBACK_NORMAL_HOURS = 7;

function cadreFromChantier(chantier) {
  if (!chantier) return null;
  const start =
    chantier.heure_debut_matin ||
    chantier.heure_debut_apres_midi ||
    null;
  const end =
    chantier.heure_fin_apres_midi ||
    chantier.heure_fin_matin ||
    null;
  if (!start || !end) return null;
  const a = minutesFromTime(start);
  const b = minutesFromTime(end);
  if (a == null || b == null || b <= a) return null;
  return { debut: start, fin: end };
}

/**
 * Split one work interval into normales / supplémentaires.
 * Cadre present → intersection = normales; after cadre_fin = HS.
 * No cadre → min(total, 7) / max(total-7, 0).
 */
export function splitHours(travailDebut, travailFin, cadreDebut, cadreFin) {
  const total = durationHours(travailDebut, travailFin);
  if (total <= 0) {
    return { heures_normales: 0, heures_supplementaires: 0, total_heures: 0 };
  }

  const cStart = minutesFromTime(cadreDebut);
  const cEnd = minutesFromTime(cadreFin);
  const wStart = minutesFromTime(travailDebut);
  const wEnd = minutesFromTime(travailFin);

  if (cStart == null || cEnd == null || cEnd <= cStart || wStart == null || wEnd == null) {
    const normales = Math.min(total, FALLBACK_NORMAL_HOURS);
    return {
      heures_normales: normales,
      heures_supplementaires: Math.max(total - FALLBACK_NORMAL_HOURS, 0),
      total_heures: total,
    };
  }

  const overlapStart = Math.max(wStart, cStart);
  const overlapEnd = Math.min(wEnd, cEnd);
  const normalesMin = Math.max(0, overlapEnd - overlapStart);
  const normales = Math.round((normalesMin / 60) * 100) / 100;
  const afterCadreMin = Math.max(0, wEnd - cEnd);
  const hs = Math.round((afterCadreMin / 60) * 100) / 100;
  return {
    heures_normales: normales,
    heures_supplementaires: hs,
    total_heures: Math.round((normales + hs) * 100) / 100,
  };
}

/** Synthesize day totals from active (non-rejetee) periods + chantier cadre. */
export function synthesizeDay(periods, chantier) {
  const cadre = cadreFromChantier(chantier);
  let heures_normales = 0;
  let heures_supplementaires = 0;
  let nb_paniers = 0;
  let from_suggestion = false;

  for (const p of periods) {
    if (p.statut === 'rejetee') continue;
    if (!p.heure_fin) continue;
    const split = splitHours(
      p.heure_debut,
      p.heure_fin,
      cadre?.debut,
      cadre?.fin,
    );
    heures_normales += split.heures_normales;
    heures_supplementaires += split.heures_supplementaires;
    if (p.panier) nb_paniers += 1;
    if (p.from_suggestion) from_suggestion = true;
  }

  return {
    heures_normales: Math.round(heures_normales * 100) / 100,
    heures_supplementaires: Math.round(heures_supplementaires * 100) / 100,
    nb_paniers,
    from_suggestion,
  };
}
