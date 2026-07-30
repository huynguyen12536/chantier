import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';
import { assertSameCompany, tenantId } from '../../shared/authz/tenantScope.js';
import { logPlatformAudit } from '../platform-audit/service.js';

const TAX_ID_PATTERN = /^[A-Za-z0-9\-.\s]+$/;
const DEFAULT_COMPANY_SLUG = 'default-company';

async function assertCompanyDisableAllowed(company) {
  if (company.slug === DEFAULT_COMPANY_SLUG) {
    throw new AppError('Default company cannot be disabled', 409, {
      code: 'DEFAULT_COMPANY_PROTECTED',
    });
  }
}

async function assertCompanyDeletable(company) {
  if (company.slug === DEFAULT_COMPANY_SLUG) {
    throw new AppError('Default company cannot be deleted', 409, {
      code: 'DEFAULT_COMPANY_PROTECTED',
    });
  }
  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS n FROM companies`);
  if (countRows[0].n <= 1) {
    throw new AppError('Cannot delete the last company', 409, { code: 'LAST_COMPANY' });
  }
  const { rows: depRows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM profiles WHERE company_id = $1) AS profiles,
       (SELECT COUNT(*)::int FROM chantiers WHERE company_id = $1) AS chantiers`,
    [company.id],
  );
  const { profiles, chantiers } = depRows[0];
  if (profiles > 0 || chantiers > 0) {
    throw new AppError('Company has dependent data; disable instead of delete', 409, {
      code: 'COMPANY_HAS_DATA',
    });
  }
}

const companySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  status: z.enum(['pending', 'active', 'disabled']).optional(),
  address: z.string().max(500).optional().nullable(),
  tax_id: z
    .string()
    .max(50)
    .optional()
    .nullable()
    .refine((v) => !v || TAX_ID_PATTERN.test(v), { message: 'Invalid tax ID format' }),
});

function normalizeOptionalText(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

const settingsSchema = z.object({
  logo: z.string().max(500).optional().nullable(),
  timezone: z.string().max(64).optional(),
  workingHours: z.record(z.unknown()).optional(),
  overtimeRules: z.record(z.unknown()).optional(),
  holidayConfiguration: z.array(z.unknown()).optional(),
  approvalConfiguration: z.record(z.unknown()).optional(),
});

function mapCompany(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    address: row.address ?? null,
    tax_id: row.tax_id ?? null,
    settings: row.settings ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listCompanies() {
  const { rows } = await query(`SELECT * FROM companies ORDER BY name ASC`);
  return rows.map(mapCompany);
}

export async function getCompany(id) {
  const { rows } = await query(`SELECT * FROM companies WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Company not found', 404, { code: 'NOT_FOUND' });
  return mapCompany(rows[0]);
}

export async function createCompany(input, actor) {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid company', 400, { code: 'VALIDATION_ERROR' });
  }
  const address = normalizeOptionalText(parsed.data.address);
  const taxId = normalizeOptionalText(parsed.data.tax_id);
  const { rows } = await query(
    `INSERT INTO companies (name, slug, status, address, tax_id)
     VALUES ($1, $2, COALESCE($3, 'active'), $4, $5)
     RETURNING *`,
    [parsed.data.name, parsed.data.slug, parsed.data.status ?? 'active', address, taxId],
  );
  await logPlatformAudit(actor, 'company.create', { type: 'company', id: rows[0].id }, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    address,
    tax_id: taxId,
  });
  return mapCompany(rows[0]);
}

export async function updateCompany(id, input, actor) {
  const parsed = companySchema.partial().safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid company', 400, { code: 'VALIDATION_ERROR' });
  }
  const existing = await getCompany(id);
  if (parsed.data.status === 'disabled') {
    await assertCompanyDisableAllowed(existing);
  }
  const address =
    parsed.data.address !== undefined ? normalizeOptionalText(parsed.data.address) : undefined;
  const taxId =
    parsed.data.tax_id !== undefined ? normalizeOptionalText(parsed.data.tax_id) : undefined;
  const { rows } = await query(
    `UPDATE companies SET
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       status = COALESCE($4, status),
       address = CASE WHEN $5::boolean THEN $6 ELSE address END,
       tax_id = CASE WHEN $7::boolean THEN $8 ELSE tax_id END,
       updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      parsed.data.name ?? null,
      parsed.data.slug ?? null,
      parsed.data.status ?? null,
      address !== undefined,
      address ?? null,
      taxId !== undefined,
      taxId ?? null,
    ],
  );
  await logPlatformAudit(actor, 'company.update', { type: 'company', id, company_id: id }, {
    before: existing,
    after: rows[0],
  });
  return mapCompany(rows[0]);
}

export async function deleteCompany(id, actor) {
  const existing = await getCompany(id);
  await assertCompanyDeletable(existing);
  await query(`DELETE FROM companies WHERE id = $1`, [id]);
  await logPlatformAudit(actor, 'company.delete', { type: 'company', id, company_id: id });
  return { ok: true };
}

export async function getCompanyStats(companyId) {
  const company = await getCompany(companyId);
  const counts = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM profiles WHERE company_id = $1 AND role = 'admin') AS admins,
       (SELECT COUNT(*)::int FROM profiles WHERE company_id = $1 AND role = 'chef_equipe') AS managers,
       (SELECT COUNT(*)::int FROM profiles WHERE company_id = $1 AND role = 'ouvrier') AS workers,
       (SELECT COUNT(*)::int FROM chantiers WHERE company_id = $1) AS chantiers,
       (SELECT COUNT(*)::int FROM declarations_heures WHERE company_id = $1) AS declarations`,
    [companyId],
  );
  return { company, stats: counts.rows[0] };
}

export async function getCompanySettings(id, actor) {
  const company = await getCompany(id);
  if (actor.role !== 'system_admin') {
    assertSameCompany(actor, id);
  }
  return { company_id: company.id, name: company.name, settings: company.settings };
}

export async function updateCompanySettings(id, input, actor) {
  if (actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  assertSameCompany(actor, id);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid settings', 400, { code: 'VALIDATION_ERROR' });
  }
  const existing = await getCompany(id);
  const merged = { ...(existing.settings ?? {}), ...parsed.data };
  const { rows } = await query(
    `UPDATE companies SET settings = $2::jsonb, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, JSON.stringify(merged)],
  );
  return mapCompany(rows[0]);
}

export async function getOwnCompanySettings(actor) {
  const id = tenantId(actor);
  return getCompanySettings(id, actor);
}

export async function updateOwnCompanySettings(input, actor) {
  const id = tenantId(actor);
  return updateCompanySettings(id, input, actor);
}
