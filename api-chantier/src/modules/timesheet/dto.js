/**
 * Imp-06 DTO — FE contract aliases without renaming storage columns (P3).
 * Storage: panier, latitude, longitude
 * External: panier_repas, latitude_debut, longitude_debut (+ optional fin keys null)
 */

/** Normalize pg Date / ISO / date-key → YYYY-MM-DD (calendar day, UTC-safe for DATE cols). */
export function toDateKey(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/** Map inbound FE/request body → internal row fields. */
export function fromPeriodRequest(body = {}) {
  const latitude =
    body.latitude_debut !== undefined ? body.latitude_debut : body.latitude;
  const longitude =
    body.longitude_debut !== undefined ? body.longitude_debut : body.longitude;
  const panier =
    body.panier_repas !== undefined ? body.panier_repas : body.panier;

  return {
    user_id: body.user_id,
    chantier_id: body.chantier_id,
    date: body.date,
    heure_debut: body.heure_debut,
    heure_fin: body.heure_fin,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    panier: panier ?? false,
    deplacement: body.deplacement ?? false,
    from_suggestion: body.from_suggestion ?? false,
    statut: body.statut,
    commentaire:
      typeof body.commentaire === 'string' && body.commentaire.trim()
        ? body.commentaire.trim()
        : null,
    validated_by: body.validated_by,
    validated_at: body.validated_at,
  };
}

/** Partial patch inbound → internal. */
export function fromPeriodPatch(body = {}) {
  const out = {};
  if (body.user_id !== undefined) out.user_id = body.user_id;
  if (body.chantier_id !== undefined) out.chantier_id = body.chantier_id;
  if (body.date !== undefined) out.date = body.date;
  if (body.heure_debut !== undefined) out.heure_debut = body.heure_debut;
  if (body.heure_fin !== undefined) out.heure_fin = body.heure_fin;
  if (body.latitude_debut !== undefined || body.latitude !== undefined) {
    out.latitude =
      body.latitude_debut !== undefined ? body.latitude_debut : body.latitude;
  }
  if (body.longitude_debut !== undefined || body.longitude !== undefined) {
    out.longitude =
      body.longitude_debut !== undefined ? body.longitude_debut : body.longitude;
  }
  if (body.panier_repas !== undefined || body.panier !== undefined) {
    out.panier = body.panier_repas !== undefined ? body.panier_repas : body.panier;
  }
  if (body.deplacement !== undefined) out.deplacement = body.deplacement;
  if (body.from_suggestion !== undefined) out.from_suggestion = body.from_suggestion;
  if (body.statut !== undefined) out.statut = body.statut;
  if (body.commentaire !== undefined) {
    out.commentaire =
      typeof body.commentaire === 'string' && body.commentaire.trim()
        ? body.commentaire.trim()
        : null;
  }
  if (body.validated_by !== undefined) out.validated_by = body.validated_by;
  if (body.validated_at !== undefined) out.validated_at = body.validated_at;
  return out;
}

/** Serialize period for FE-compatible responses. */
export function mapPeriod(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    chantier_id: row.chantier_id,
    date: toDateKey(row.date),
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    latitude_debut: row.latitude,
    longitude_debut: row.longitude,
    latitude_fin: null,
    longitude_fin: null,
    panier_repas: Boolean(row.panier),
    deplacement: row.deplacement,
    from_suggestion: row.from_suggestion,
    statut: row.statut,
    commentaire: row.commentaire ?? null,
    validated_by: row.validated_by,
    validated_at: row.validated_at,
  };
}

export function mapDeclaration(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    chantier_id: row.chantier_id,
    date: toDateKey(row.date),
    heures_normales: Number(row.heures_normales),
    heures_supplementaires: Number(row.heures_supplementaires),
    nb_paniers: row.nb_paniers,
    nb_deplacements: row.nb_deplacements,
    from_suggestion: row.from_suggestion,
    statut: row.statut,
    validated_by: row.validated_by,
    validated_at: row.validated_at,
  };
}
