/**
 * Shared Imp-12 table/auth error envelope (Wave A style).
 */
export function toErrorResponse(err) {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return {
    status,
    body: { error: err?.message || 'Internal server error' },
  };
}

export function ok(body, status = 200) {
  return { status, body };
}
