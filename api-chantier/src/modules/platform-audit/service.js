import { query } from '../../shared/db/pool.js';

export async function logPlatformAudit(actor, action, entity = {}, metadata = {}) {
  await query(
    `INSERT INTO platform_audit_logs (actor_id, company_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      actor?.id ?? null,
      entity.company_id ?? null,
      action,
      entity.type ?? null,
      entity.id ?? null,
      JSON.stringify(metadata),
    ],
  );
}

export async function listAuditLogs(filters = {}) {
  const params = [];
  let sql = `SELECT l.*, p.email AS actor_email
    FROM platform_audit_logs l
    LEFT JOIN profiles p ON p.id = l.actor_id
    WHERE 1=1`;

  if (filters.company_id) {
    params.push(filters.company_id);
    sql += ` AND l.company_id = $${params.length}`;
  }
  if (filters.from) {
    params.push(filters.from);
    sql += ` AND l.created_at >= $${params.length}::timestamptz`;
  }
  if (filters.to) {
    params.push(filters.to);
    sql += ` AND l.created_at <= $${params.length}::timestamptz`;
  }

  sql += ' ORDER BY l.created_at DESC LIMIT 500';
  const { rows } = await query(sql, params);
  return rows;
}
