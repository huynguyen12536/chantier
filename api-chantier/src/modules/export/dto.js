/**
 * Imp-08 DTO adapters — FE contract field names without changing storage.
 * FE export.tsx selects panier_repas; storage column remains panier (Imp-06).
 */

export function mapPayrollPeriod(row) {
  return {
    id: row.id,
    date: row.date,
    user_id: row.user_id,
    chantier_id: row.chantier_id,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    panier_repas: Boolean(row.panier),
    panier: Boolean(row.panier), // internal alias (tests / dual-read)
    deplacement: row.deplacement,
    statut: row.statut,
    profiles: { nom: row.user_nom, prenom: row.user_prenom },
    chantiers: { nom: row.chantier_nom, adresse: row.chantier_adresse },
  };
}

export function mapDeclarationExport(row) {
  return {
    id: row.id,
    date: row.date,
    user_id: row.user_id,
    chantier_id: row.chantier_id,
    heures_normales: Number(row.heures_normales),
    heures_supplementaires: Number(row.heures_supplementaires),
    nb_paniers: row.nb_paniers,
    nb_deplacements: row.nb_deplacements,
    statut: row.statut,
    chantiers: {
      nom: row.chantier_nom,
      code: row.chantier_code,
    },
  };
}
