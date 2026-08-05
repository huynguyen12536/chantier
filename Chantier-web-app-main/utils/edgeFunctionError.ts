/** Normalize Supabase Edge Function / gateway error payloads for UI alerts. */
export function parseEdgeFunctionError(
  json: unknown,
  fallback: string,
): string {
  if (!json || typeof json !== 'object') return fallback;
  const record = json as { error?: unknown; message?: unknown };
  const error = typeof record.error === 'string' ? record.error.trim() : '';
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  return error || message || fallback;
}
