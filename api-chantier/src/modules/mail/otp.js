import { createHash, randomInt } from 'node:crypto';
import { query } from '../../shared/db/pool.js';
import { AppError } from '../../shared/errors/AppError.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(email, otp) {
  const secret = process.env.OTP_SECRET ?? process.env.JWT_SECRET ?? 'otp';
  return createHash('sha256')
    .update(`${email.toLowerCase()}:${otp}:${secret}`)
    .digest('hex');
}

export function otpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

export function resendAllowedAfter(createdAt) {
  return Date.now() - new Date(createdAt).getTime() >= RESEND_COOLDOWN_MS;
}

export async function findUserIdByEmail(email) {
  const { rows } = await query(
    `SELECT id FROM profiles WHERE lower(email) = lower($1) AND actif = true LIMIT 1`,
    [email],
  );
  return rows[0]?.id ?? null;
}

export async function sendPasswordResetOtp(email, lang = 'fr') {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) {
    throw new AppError('invalid_email', 400, { code: 'VALIDATION_ERROR' });
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return { success: true };
  }

  const { rows: recentRows } = await query(
    `SELECT created_at FROM password_reset_otps
     WHERE lower(email) = lower($1) AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [normalized],
  );

  if (recentRows[0]?.created_at && !resendAllowedAfter(recentRows[0].created_at)) {
    throw new AppError('rate_limited', 429, { code: 'RATE_LIMITED' });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(normalized, otp);

  await query(
    `INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [normalized, otpHash, otpExpiresAt()],
  );

  const { enqueueJob } = await import('../jobs/index.js');
  const { JOB_MAIL_SEND } = await import('../jobs/jobTypes.js');

  enqueueJob({
    type: JOB_MAIL_SEND,
    payload: {
      to: normalized,
      template: 'password_reset_otp',
      subject:
        lang === 'en'
          ? 'Tubesca 3D — Password reset code'
          : 'Tubesca 3D — Code de réinitialisation',
      data: { otp, lang },
    },
    idempotencyKey: `mail:otp:${normalized}:${otpHash.slice(0, 12)}`,
  });

  return { success: true };
}

export async function resetPasswordWithOtp(email, otp, password) {
  const normalized = email.trim().toLowerCase();
  if (!/^\d{6}$/.test(String(otp ?? '').trim())) {
    throw new AppError('invalid_otp', 400, { code: 'VALIDATION_ERROR' });
  }
  if (!password || password.length < 6) {
    throw new AppError('password_too_short', 400, { code: 'VALIDATION_ERROR' });
  }

  const otpHash = hashOtp(normalized, otp.trim());
  const now = new Date().toISOString();

  const { rows: otpRows } = await query(
    `SELECT id FROM password_reset_otps
     WHERE lower(email) = lower($1) AND otp_hash = $2 AND used_at IS NULL AND expires_at > $3
     ORDER BY created_at DESC LIMIT 1`,
    [normalized, otpHash, now],
  );

  if (!otpRows[0]) {
    throw new AppError('invalid_or_expired_otp', 400, { code: 'VALIDATION_ERROR' });
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    throw new AppError('user_not_found', 404, { code: 'NOT_FOUND' });
  }

  const { hashPassword } = await import('../auth/service.js');
  const passwordHash = await hashPassword(password);

  await query(`UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
    passwordHash,
    userId,
  ]);

  await query(`UPDATE password_reset_otps SET used_at = $1 WHERE id = $2`, [now, otpRows[0].id]);
  await query(
    `UPDATE password_reset_otps SET used_at = $1 WHERE lower(email) = lower($2) AND used_at IS NULL`,
    [now, normalized],
  );

  return { success: true };
}
