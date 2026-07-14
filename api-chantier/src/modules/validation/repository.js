/**
 * Validation / Review repository — persistence only.
 */
import { clientQuery, query } from '../../shared/db/pool.js';

export async function getDeclaration(client, id) {
  const { rows } = await clientQuery(
    client,
    `SELECT * FROM declarations_heures WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getDeclarationById(id) {
  const { rows } = await query(`SELECT * FROM declarations_heures WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Conditional decision update — concurrency from expected statut(s).
 */
export async function applyDeclarationDecision(client, id, statut, actorId, fromAllowed) {
  const { rows } = await clientQuery(
    client,
    `UPDATE declarations_heures SET
       statut = $2,
       validated_by = $3,
       validated_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
       AND statut = ANY($4::text[])
     RETURNING *`,
    [id, statut, actorId, fromAllowed],
  );
  return rows[0] ?? null;
}

export async function deletePeriodsForDeclarationKey(client, userId, chantierId, date) {
  await clientQuery(
    client,
    `DELETE FROM periodes_travail
     WHERE user_id = $1 AND chantier_id = $2 AND date = $3`,
    [userId, chantierId, date],
  );
}

export async function listSoumiseAll() {
  const { rows } = await query(
    `SELECT * FROM declarations_heures
     WHERE statut = 'soumise'
     ORDER BY date DESC, created_at DESC`,
  );
  return rows;
}

export async function listSoumiseForChantiers(chantierIds) {
  if (!chantierIds.length) return [];
  const { rows } = await query(
    `SELECT * FROM declarations_heures
     WHERE statut = 'soumise'
       AND chantier_id = ANY($1::uuid[])
     ORDER BY date DESC, created_at DESC`,
    [chantierIds],
  );
  return rows;
}

export async function insertAuditEvent(client, event) {
  const { rows } = await clientQuery(
    client,
    `INSERT INTO approval_audit_events (
       entity_type, entity_id, declaration_id, action,
       from_statut, to_statut, actor_id, reason, correlation_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      event.entity_type,
      event.entity_id,
      event.declaration_id ?? null,
      event.action,
      event.from_statut ?? null,
      event.to_statut,
      event.actor_id,
      event.reason ?? null,
      event.correlation_id ?? null,
    ],
  );
  return rows[0];
}

export async function listAuditByDeclaration(declarationId) {
  const { rows } = await query(
    `SELECT * FROM approval_audit_events
     WHERE declaration_id = $1
     ORDER BY created_at ASC`,
    [declarationId],
  );
  return rows;
}
