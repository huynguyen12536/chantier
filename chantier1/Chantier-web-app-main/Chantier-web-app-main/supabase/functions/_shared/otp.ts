const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

export async function hashOtp(email: string, otp: string): Promise<string> {
  const secret = Deno.env.get("OTP_SECRET") ?? "otp";
  const data = new TextEncoder().encode(`${email.toLowerCase()}:${otp}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

export function resendAllowedAfter(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() >= RESEND_COOLDOWN_MS;
}

export { OTP_TTL_MS, RESEND_COOLDOWN_MS };
