import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

const ROLES = ['ouvrier', 'chef_equipe', 'administratif', 'admin', 'system_admin'];
const BUSINESS_ROLES = ['ouvrier', 'chef_equipe', 'administratif', 'admin'];

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
});

function hashToken(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

function publicProfile(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    nom: row.nom,
    prenom: row.prenom,
    matricule: row.matricule,
    phone: row.phone ?? '',
    actif: row.actif,
    company_id: row.company_id ?? null,
    company_name: row.company_name ?? null,
    company_slug: row.company_slug ?? null,
  };
}

export function signAccessToken(profile) {
  return jwt.sign(
    {
      sub: profile.id,
      role: profile.role,
      email: profile.email,
      company_id: profile.company_id ?? null,
      company_status: profile.company_status ?? null,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export async function issueRefreshToken(profileId) {
  const raw = randomBytes(48).toString('base64url');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + env.refreshExpiresMs);
  await query(
    `INSERT INTO refresh_tokens (profile_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [profileId, tokenHash, expiresAt.toISOString()],
  );
  return raw;
}

export async function login(input) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid credentials payload', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const { email, password } = parsed.data;
  const { rows } = await query(
    `SELECT p.id, p.email, p.password_hash, p.role, p.nom, p.prenom, p.matricule, p.phone, p.actif,
            p.company_id, c.status AS company_status
     FROM profiles p
     LEFT JOIN companies c ON c.id = p.company_id
     WHERE lower(p.email) = lower($1) LIMIT 1`,
    [email],
  );
  const profile = rows[0];
  if (!profile || !profile.actif) {
    throw new AppError('Invalid email or password', 401, { code: 'INVALID_CREDENTIALS' });
  }

  const ok = await bcrypt.compare(password, profile.password_hash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, { code: 'INVALID_CREDENTIALS' });
  }

  const accessToken = signAccessToken(profile);
  const refreshToken = await issueRefreshToken(profile.id);
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user: publicProfile(profile),
  };
}

export async function refresh(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new AppError('Refresh token required', 400, { code: 'VALIDATION_ERROR' });
  }
  const tokenHash = hashToken(refreshToken);
  const { rows } = await query(
    `SELECT rt.id, rt.profile_id, rt.expires_at, rt.revoked_at,
            p.id AS pid, p.email, p.role, p.nom, p.prenom, p.matricule, p.phone, p.actif,
            p.company_id, c.status AS company_status
     FROM refresh_tokens rt
     JOIN profiles p ON p.id = rt.profile_id
     LEFT JOIN companies c ON c.id = p.company_id
     WHERE rt.token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date() || !row.actif) {
    throw new AppError('Invalid refresh token', 401, { code: 'INVALID_REFRESH' });
  }

  await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [row.id]);
  const profile = {
    id: row.pid,
    email: row.email,
    role: row.role,
    nom: row.nom,
    prenom: row.prenom,
    matricule: row.matricule,
    phone: row.phone,
    actif: row.actif,
    company_id: row.company_id,
    company_status: row.company_status,
  };
  const accessToken = signAccessToken(profile);
  const newRefresh = await issueRefreshToken(profile.id);
  return {
    accessToken,
    refreshToken: newRefresh,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user: publicProfile(profile),
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) return { ok: true };
  const tokenHash = hashToken(refreshToken);
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
  return { ok: true };
}

export async function getProfileById(id) {
  const { rows } = await query(
    `SELECT p.id, p.email, p.role, p.nom, p.prenom, p.matricule, p.phone, p.actif, p.company_id,
            c.name AS company_name, c.slug AS company_slug
     FROM profiles p
     LEFT JOIN companies c ON c.id = p.company_id
     WHERE p.id = $1 LIMIT 1`,
    [id],
  );
  if (!rows[0] || !rows[0].actif) {
    throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  }
  return publicProfile(rows[0]);
}

export async function hashPassword(password) {
  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400, { code: 'VALIDATION_ERROR' });
  }
  return bcrypt.hash(password, 10);
}

export { ROLES, BUSINESS_ROLES, publicProfile, loginSchema };
