import type { Company } from '@/types';
import { apiErrorMessage } from '@/services/supabase';
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl';
import { isCompanyDisabledResponse, triggerCompanyDisabled } from '@/utils/companyDisabled';

function apiUrl() {
  return resolveApiBaseUrl();
}

async function platformFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (isCompanyDisabledResponse(res.status, body)) {
    triggerCompanyDisabled();
  }
  if (!res.ok) {
    throw new Error(apiErrorMessage(body, `HTTP ${res.status}`));
  }
  return body;
}

export type PlatformDashboardGlobal = {
  companies: {
    total: number;
    active: number;
    disabled: number;
    pending: number;
  };
  users_by_role: Array<{ role: string; count: number }>;
  totals: {
    chantiers: number;
    declarations: number;
  };
};

export type PlatformDashboardCompany = {
  company: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  stats: {
    admins: number;
    managers: number;
    workers: number;
    chantiers: number;
    declarations: number;
  };
};

export type PlatformDashboardStats = PlatformDashboardGlobal | PlatformDashboardCompany;

export function isCompanyDashboard(
  stats: PlatformDashboardStats,
): stats is PlatformDashboardCompany {
  return 'company' in stats && 'stats' in stats;
}

export async function fetchPlatformDashboard(
  token: string,
  companyId?: string | null,
): Promise<PlatformDashboardStats> {
  const q = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
  return platformFetch(`/api/platform/dashboard${q}`, token);
}

export type CompaniesResponse = { companies: Company[] };

export async function fetchCompanies(token: string): Promise<CompaniesResponse> {
  return platformFetch('/api/platform/companies', token);
}

export async function fetchCompany(token: string, id: string): Promise<{ company: Company }> {
  return platformFetch(`/api/platform/companies/${id}`, token);
}

export async function createCompany(
  token: string,
  payload: {
    name: string;
    slug: string;
    status?: Company['status'];
    address?: string | null;
    tax_id?: string | null;
  },
): Promise<{ company: Company }> {
  return platformFetch('/api/platform/companies', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type UpdateCompanyPayload = {
  name?: string;
  slug?: string;
  status?: Company['status'];
  address?: string | null;
  tax_id?: string | null;
};

export async function updateCompany(
  token: string,
  id: string,
  payload: UpdateCompanyPayload,
): Promise<{ company: Company }> {
  return platformFetch(`/api/platform/companies/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function setCompanyStatus(
  token: string,
  id: string,
  status: Company['status'],
): Promise<{ company: Company }> {
  return updateCompany(token, id, { status });
}

export async function deleteCompany(token: string, id: string): Promise<{ ok: true }> {
  return platformFetch(`/api/platform/companies/${id}`, token, {
    method: 'DELETE',
  });
}

export type PlatformUser = {
  id: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
  actif: boolean;
  company_id: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
};

export type PlatformUserRoleFilter = 'admin' | 'chef_equipe' | 'ouvrier';

export async function fetchPlatformUsers(
  token: string,
  options?: { companyId?: string | null; role?: PlatformUserRoleFilter | null },
): Promise<{ users: PlatformUser[] }> {
  const params = new URLSearchParams();
  const companyId = options?.companyId;
  const role = options?.role;
  if (companyId) params.set('company_id', companyId);
  if (role) params.set('role', role);
  const q = params.toString() ? `?${params.toString()}` : '';
  return platformFetch(`/api/platform/users${q}`, token);
}

export async function createCompanyAdmin(
  token: string,
  payload: {
    company_id: string;
    email: string;
    password: string;
    nom: string;
    prenom: string;
  },
) {
  return platformFetch('/api/platform/users/company-admins', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type UpdatePlatformUserPayload = {
  email?: string;
  nom?: string;
  prenom?: string;
  phone?: string | null;
};

export async function updatePlatformUser(
  token: string,
  id: string,
  payload: UpdatePlatformUserPayload,
): Promise<{ user: PlatformUser }> {
  return platformFetch(`/api/platform/users/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePlatformUser(token: string, id: string): Promise<{ ok: true }> {
  return platformFetch(`/api/platform/users/${id}`, token, {
    method: 'DELETE',
  });
}

export async function lockPlatformUser(
  token: string,
  id: string,
): Promise<{ user: PlatformUser }> {
  return platformFetch(`/api/platform/users/${id}/lock`, token, {
    method: 'POST',
  });
}

export async function unlockPlatformUser(
  token: string,
  id: string,
): Promise<{ user: PlatformUser }> {
  return platformFetch(`/api/platform/users/${id}/unlock`, token, {
    method: 'POST',
  });
}

export async function resetPlatformUserPassword(
  token: string,
  id: string,
  password: string,
): Promise<{ ok: true }> {
  return platformFetch(`/api/platform/users/${id}/reset-password`, token, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function fetchAuditLogs(token: string, companyId?: string | null) {
  const q = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
  return platformFetch(`/api/platform/audit-logs${q}`, token);
}

export type PlatformAuditLog = {
  id: string;
  actor_id: string | null;
  company_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_email: string | null;
};

export async function fetchCompanySettings(token: string) {
  return platformFetch('/api/companies/settings', token);
}

export async function patchCompanySettings(token: string, settings: Record<string, unknown>) {
  return platformFetch('/api/companies/settings', token, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}
