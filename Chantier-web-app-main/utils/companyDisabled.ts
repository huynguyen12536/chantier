type CompanyDisabledHandler = () => void;

let handler: CompanyDisabledHandler | null = null;
let pending = false;

export function setCompanyDisabledHandler(fn: CompanyDisabledHandler | null) {
  handler = fn;
}

export function triggerCompanyDisabled() {
  if (pending) return;
  pending = true;
  handler?.();
}

export function resetCompanyDisabled() {
  pending = false;
}

export function isCompanyDisabledPending() {
  return pending;
}

export function isCompanyDisabledCode(code: string | undefined): boolean {
  return code === 'COMPANY_DISABLED';
}

/** Extract API error code from Unified API or compat response bodies. */
export function extractApiErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.code === 'string') return record.code;
  const err = record.error;
  if (err && typeof err === 'object' && typeof (err as { code?: unknown }).code === 'string') {
    return (err as { code: string }).code;
  }
  return undefined;
}

export function isCompanyDisabledResponse(status: number, body: unknown): boolean {
  return status === 403 && isCompanyDisabledCode(extractApiErrorCode(body));
}
