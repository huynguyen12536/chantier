const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
export function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}