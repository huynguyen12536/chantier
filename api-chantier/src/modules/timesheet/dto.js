/** DTO helpers — Imp-06 */

export function mapPeriod(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    chantier_id: row.chantier_id,
    date: row.date,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    latitude: row.latitude,
    longitude: row.longitude,
    panier: row.panier,
    deplacement: row.deplacement,
    from_suggestion: row.from_suggestion,
    statut: row.statut,
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
    date: row.date,
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
