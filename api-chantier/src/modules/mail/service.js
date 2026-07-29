import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { query } from '../../shared/db/pool.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/utils/logger.js';
import { env } from '../../config/env.js';
import { enqueueJob } from '../jobs/index.js';
import { JOB_MAIL_SEND } from '../jobs/jobTypes.js';

const forgotSchema = z.object({
  email: z.string().email().max(320),
});

function hashToken(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Queue password-reset email via worker (never send directly from controller).
 */
export async function requestPasswordReset(input) {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid email', 400, { code: 'VALIDATION_ERROR' });
  }

  const email = parsed.data.email.toLowerCase();
  const { rows } = await query(
    `SELECT id, email, prenom, nom FROM profiles WHERE lower(email) = $1 AND actif = true LIMIT 1`,
    [email],
  );

  // Always return success to avoid email enumeration
  if (!rows[0]) {
    logger.info('mail.forgot.unknown_email', { email });
    return { ok: true };
  }

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await query(
    `INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [rows[0].id, tokenHash, expiresAt.toISOString()],
  );

  const resetUrl = `${env.appPublicUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  enqueueJob({
    type: JOB_MAIL_SEND,
    payload: {
      to: rows[0].email,
      template: 'password_reset',
      subject: 'Réinitialisation de mot de passe — Chantier',
      data: {
        prenom: rows[0].prenom,
        nom: rows[0].nom,
        resetUrl,
      },
    },
    idempotencyKey: `mail:password_reset:${rows[0].id}:${tokenHash.slice(0, 16)}`,
  });

  return { ok: true };
}

/**
 * Send email (called by worker only).
 * @param {{ to: string, subject: string, template: string, data?: object }} payload
 */
export async function sendMail(payload) {
  const { to, subject, template, data = {} } = payload;

  if (!env.smtpHost) {
    logger.info('mail.dev.log_only', { to, subject, template, data });
    return { sent: false, mode: 'log_only' };
  }

  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser
      ? { user: env.smtpUser, pass: env.smtpPass }
      : undefined,
  });

  const text = buildText(template, data);
  const html = buildHtml(template, data);

  await transport.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFrom}>`,
    to,
    subject,
    text,
    html,
  });

  logger.info('mail.sent', { to, template });
  return { sent: true, mode: 'smtp' };
}

function buildText(template, data) {
  if (template === 'password_reset_otp') {
    const otp = data.otp ?? '';
    return data.lang === 'en'
      ? `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.`
      : `Votre code de réinitialisation est : ${otp}\n\nCe code expire dans 10 minutes.`;
  }
  if (template === 'password_reset') {
    return `Bonjour ${data.prenom ?? ''},\n\nCliquez pour réinitialiser votre mot de passe:\n${data.resetUrl}\n\nCe lien expire dans 1 heure.`;
  }
  return JSON.stringify(data);
}

function buildHtml(template, data) {
  if (template === 'password_reset_otp') {
    const otp = data.otp ?? '';
    return data.lang === 'en'
      ? `<p>Your password reset code is: <strong>${otp}</strong></p>`
      : `<p>Votre code de réinitialisation est : <strong>${otp}</strong></p>`;
  }
  if (template === 'password_reset') {
    return `<p>Bonjour ${data.prenom ?? ''},</p><p><a href="${data.resetUrl}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 1 heure.</p>`;
  }
  return `<pre>${JSON.stringify(data)}</pre>`;
}

export { forgotSchema };
