import { supabaseAnonKey, supabaseUrl } from '@/services/supabase';

type PasswordResetLang = 'fr' | 'en';

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: { error?: string; success?: boolean } = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    throw new Error(json.error || text || 'request_failed');
  }

  return json as T;
}

export async function sendPasswordResetOtp(email: string, lang: PasswordResetLang = 'fr'): Promise<void> {
  await callEdgeFunction('send-password-reset-otp', {
    email: email.trim().toLowerCase(),
    lang,
  });
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  password: string,
): Promise<void> {
  await callEdgeFunction('reset-password-with-otp', {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    password,
  });
}

export function mapPasswordResetError(code: string, t: {
  forgotPassword: { rateLimited: string };
  resetPassword: {
    invalidOtp: string;
    passwordTooShort: string;
    mailNotConfigured: string;
    genericError: string;
  };
}): string {
  switch (code) {
    case 'rate_limited':
      return t.forgotPassword.rateLimited;
    case 'invalid_or_expired_otp':
    case 'invalid_otp':
      return t.resetPassword.invalidOtp;
    case 'password_too_short':
      return t.resetPassword.passwordTooShort;
    case 'mail_not_configured':
      return t.resetPassword.mailNotConfigured;
    default:
      return t.resetPassword.genericError;
  }
}
