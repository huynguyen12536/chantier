import { apiUrl } from '@/services/supabase';

export type ForgotPasswordResult = {
  ok: boolean;
  queued?: boolean;
};

/**
 * Request password reset via BE worker (never send email from FE).
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : 'Too many requests — please try again later.',
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body?.error === 'string' ? body.error : 'Request failed');
  }
  return res.json();
}
