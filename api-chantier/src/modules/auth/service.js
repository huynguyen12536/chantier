import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

const ROLES = ['ouvrier', 'chef_equipe', 'administratif', 'admin'];

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
    actif: row.actif,
  };
}

export function signAccessToken(profile) {
  return jwt.sign(
    {
      sub: profile.id,
      role: profile.role,
      email: profile.email,
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
    `SELECT id, email, password_hash, role, nom, prenom, matricule, actif
     FROM profiles WHERE lower(email) = lower($1) LIMIT 1`,
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
            p.id AS pid, p.email, p.role, p.nom, p.prenom, p.matricule, p.actif
     FROM refresh_tokens rt
     JOIN profiles p ON p.id = rt.profile_id
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
    actif: row.actif,
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
    `SELECT id, email, role, nom, prenom, matricule, actif
     FROM profiles WHERE id = $1 LIMIT 1`,
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

export { ROLES, publicProfile, loginSchema };
