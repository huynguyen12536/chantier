import { clientQuery } from '../../shared/db/pool.js';

export async function insertPeriod(client, row) {
  const { rows } = await clientQuery(
    client,
    `INSERT INTO periodes_travail (
       user_id, chantier_id, date, heure_debut, heure_fin,
       latitude, longitude, panier, deplacement, from_suggestion, statut
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      row.user_id,
      row.chantier_id,
      row.date,
      row.heure_debut,
      row.heure_fin ?? null,
      row.latitude ?? null,
      row.longitude ?? null,
      row.panier ?? false,
      row.deplacement ?? false,
      row.from_suggestion ?? false,
      row.statut ?? (row.heure_fin ? 'terminee' : 'en_cours'),
    ],
  );
  return rows[0];
}

export async function updatePeriod(client, id, patch) {
  const { rows } = await clientQuery(
    client,
    `UPDATE periodes_travail SET
       heure_debut = COALESCE($2, heure_debut),
       heure_fin = COALESCE($3, heure_fin),
       latitude = COALESCE($4, latitude),
       longitude = COALESCE($5, longitude),
       panier = COALESCE($6, panier),
       deplacement = COALESCE($7, deplacement),
       statut = COALESCE($8, statut),
       validated_by = COALESCE($9, validated_by),
       validated_at = COALESCE($10, validated_at),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      patch.heure_debut ?? null,
      patch.heure_fin !== undefined ? patch.heure_fin : null,
      patch.latitude ?? null,
      patch.longitude ?? null,
      patch.panier ?? null,
      patch.deplacement ?? null,
      patch.statut ?? null,
      patch.validated_by ?? null,
      patch.validated_at ?? null,
    ],
  );
  return rows[0];
}

export async function deletePeriod(client, id) {
  const { rows } = await clientQuery(
    client,
    `DELETE FROM periodes_travail WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}

export async function getPeriod(client, id) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM periodes_travail WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function listPeriodsByKey(client, userId, chantierId, date) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM periodes_travail
     WHERE user_id = $1 AND chantier_id = $2 AND date = $3
     ORDER BY heure_debut`,
    [userId, chantierId, date],
  );
  return rows;
}

export async function listPeriods(client, filters = {}) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM periodes_travail
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::uuid IS NULL OR chantier_id = $2)
       AND ($3::date IS NULL OR date = $3::date)
     ORDER BY date DESC, heure_debut`,
    [filters.user_id ?? null, filters.chantier_id ?? null, filters.date ?? null],
  );
  return rows;
}

export async function getChantier(client, id) {
  const { rows } = await clientQuery(client, `SELECT * FROM chantiers WHERE id = $1`, [id]);
  return rows[0];
}

export async function getDeclarationByKey(client, userId, chantierId, date) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM declarations_heures
     WHERE user_id = $1 AND chantier_id = $2 AND date = $3`,
    [userId, chantierId, date],
  );
  return rows[0];
}

export async function upsertDeclarationSoumise(client, data) {
  // DR-IMP06-003: do NOT write nb_deplacements
  const { rows } = await clientQuery(
    client,
    `INSERT INTO declarations_heures (
       user_id, chantier_id, date, heures_normales, heures_supplementaires,
       nb_paniers, from_suggestion, statut, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'soumise', NOW())
     ON CONFLICT (user_id, chantier_id, date) DO UPDATE SET
       heures_normales = EXCLUDED.heures_normales,
       heures_supplementaires = EXCLUDED.heures_supplementaires,
       nb_paniers = EXCLUDED.nb_paniers,
       from_suggestion = EXCLUDED.from_suggestion,
       statut = CASE
         WHEN declarations_heures.statut IN ('validee', 'rejetee') THEN declarations_heures.statut
         ELSE 'soumise'
       END,
       updated_at = NOW()
     WHERE declarations_heures.statut NOT IN ('validee', 'rejetee')
     RETURNING *`,
    [
      data.user_id,
      data.chantier_id,
      data.date,
      data.heures_normales,
      data.heures_supplementaires,
      data.nb_paniers,
      data.from_suggestion,
    ],
  );
  if (rows[0]) return rows[0];
  return getDeclarationByKey(client, data.user_id, data.chantier_id, data.date);
}

export async function softAnnuleeDeclaration(client, userId, chantierId, date, actorId) {
  // DR-IMP06-001 Soft Annulee — never DELETE
  const { rows } = await clientQuery(
    client,
    `UPDATE declarations_heures SET
       statut = 'annulee',
       validated_by = COALESCE($4, validated_by),
       validated_at = NOW(),
       updated_at = NOW()
     WHERE user_id = $1 AND chantier_id = $2 AND date = $3
       AND statut = 'soumise'
     RETURNING *`,
    [userId, chantierId, date, actorId ?? null],
  );
  return rows[0];
}

export async function updateDeclarationDecision(client, id, statut, actorId) {
  const { rows } = await clientQuery(
    client,
    `UPDATE declarations_heures SET
       statut = $2,
       validated_by = $3,
       validated_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, statut, actorId],
  );
  return rows[0];
}

export async function propagatePeriodsStatut(client, userId, chantierId, date, statut, actorId) {
  const { rows } = await clientQuery(
    client,
    `UPDATE periodes_travail SET
       statut = $4,
       validated_by = $5,
       validated_at = NOW(),
       updated_at = NOW()
     WHERE user_id = $1 AND chantier_id = $2 AND date = $3
       AND statut IN ('terminee', 'en_cours')
     RETURNING *`,
    [userId, chantierId, date, statut, actorId],
  );
  return rows;
}

export async function findLatestValidatedPeriod(client, userId) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM periodes_travail
     WHERE user_id = $1 AND statut = 'validee' AND heure_fin IS NOT NULL
     ORDER BY date DESC, heure_debut DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0];
}

export const SYSTEM_AUTO_APPROVE_ID = '00000000-0000-4000-8000-000000000001';
