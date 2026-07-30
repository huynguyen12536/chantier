import { query } from '../../shared/db/pool.js';
import { getCompanyStats } from '../companies/service.js';

export async function getPlatformDashboard(queryParams = {}) {
  const { company_id: companyId } = queryParams;

  if (companyId) {
    return getCompanyStats(companyId);
  }

  const { rows: companyCounts } = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'active')::int AS active,
       COUNT(*) FILTER (WHERE status = 'disabled')::int AS disabled,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
     FROM companies`,
  );

  const { rows: roleCounts } = await query(
    `SELECT role, COUNT(*)::int AS count
     FROM profiles
     WHERE role <> 'system_admin'
     GROUP BY role`,
  );

  const { rows: totals } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM chantiers) AS chantiers,
       (SELECT COUNT(*)::int FROM declarations_heures) AS declarations`,
  );

  return {
    companies: companyCounts[0],
    users_by_role: roleCounts,
    totals: totals[0],
  };
}
