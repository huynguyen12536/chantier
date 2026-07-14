export const PHONE_PREFIX = '+33';
export const PHONE_LOCAL_DIGIT_LIMIT = 8;

export function extractLocalDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('33')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, PHONE_LOCAL_DIGIT_LIMIT);
}

export function sanitizePhoneInput(value: string): string {
  return extractLocalDigits(value);
}

export function formatPhoneE164(localDigits: string): string {
  if (!localDigits) return '';
  return `${PHONE_PREFIX}${localDigits}`;
}

export function isPhoneValid(phone: string): boolean {
  const trimmed = (phone ?? '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('+')) {
    return trimmed.replace(/\D/g, '').length >= 7;
  }
  return extractLocalDigits(trimmed).length === PHONE_LOCAL_DIGIT_LIMIT;
}

export function normalizePhone(phone: string): string {
  const trimmed = (phone ?? '').trim();
  if (trimmed.startsWith('+')) return trimmed;
  return formatPhoneE164(extractLocalDigits(trimmed));
}
