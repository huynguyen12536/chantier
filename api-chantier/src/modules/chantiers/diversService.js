import { query } from '../../shared/db/pool.js';
import { AppError } from '../../shared/errors/AppError.js';
import { toFeChantierHours } from '../compat/mappers/hoursMapper.js';
import { tenantId, assertSameCompany } from '../../shared/authz/tenantScope.js';
import bcrypt from 'bcryptjs';

function isAdminRole(role) {
  return role === 'admin' || role === 'administratif';
}

async function nextDiversCode(_companyId) {
  // codes are globally unique (chantiers_code_key) — scan all DIV_* rows
  const { rows } = await query(
    `SELECT code FROM chantiers WHERE code ~ '^DIV_[0-9]{3}$'`,
  );
  let max = 0;
  for (const row of rows) {
    const n = Number.parseInt(String(row.code).slice(-3), 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `DIV_${String(max + 1).padStart(3, '0')}`;
}

export async function createChantierDivers(actor, input) {
  if (actor.role !== 'ouvrier') {
    throw new AppError('Seuls les ouvriers peuvent creer un chantier divers', 403);
  }
  const companyId = tenantId(actor);

  const nom = String(input.p_nom ?? input.nom ?? '').trim();
  const adresse = String(input.p_adresse ?? input.adresse ?? '').trim();
  const motif = String(input.p_motif ?? input.motif ?? '').trim();
  const heureDebut = input.p_heure_debut ?? input.heure_debut;
  const heureFin = input.p_heure_fin ?? input.heure_fin;

  if (!nom || !adresse) {
    throw new AppError('Nom et adresse sont obligatoires', 400);
  }
  if (!heureDebut || !heureFin || heureFin <= heureDebut) {
    throw new AppError('Horaires de chantier invalides', 400);
  }

  const { rows: existingRows } = await query(
    `SELECT * FROM chantiers
     WHERE company_id = $3
       AND source = 'divers' AND divers_statut IN ('en_attente', 'approuve')
       AND lower(trim(nom)) = lower($1) AND lower(trim(adresse)) = lower($2)
     ORDER BY CASE divers_statut WHEN 'approuve' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
    [nom, adresse, companyId],
  );

  const existing = existingRows[0];
  if (existing) {
    if (existing.divers_statut === 'en_attente') {
      throw new AppError(
        "Un chantier divers avec ce nom et cette adresse est deja en attente d'approbation",
        409,
      );
    }
    const { rows: aff } = await query(
      `SELECT 1 FROM affectations_chantiers
       WHERE user_id = $1 AND chantier_id = $2 AND date_fin IS NULL LIMIT 1`,
      [actor.id, existing.id],
    );
    if (!aff[0]) {
      await query(
        `INSERT INTO affectations_chantiers (user_id, chantier_id, date_debut, company_id)
         VALUES ($1, $2, CURRENT_DATE, $3)`,
        [actor.id, existing.id, companyId],
      );
    }
    return {
      ...toFeChantierHours(existing),
      reused_existing: true,
    };
  }

  if (!motif) {
    throw new AppError('Le motif de la demande est obligatoire', 400);
  }
  if (motif.length > 500) {
    throw new AppError('Motif trop long', 400);
  }

  const code = await nextDiversCode(companyId);
  const { rows } = await query(
    `INSERT INTO chantiers (
      nom, code, adresse, actif, date_debut,
      heure_debut_matin, heure_fin_apres_midi,
      source, divers_statut, created_by, divers_creation_reason, company_id
    ) VALUES ($1,$2,$3,false,CURRENT_DATE,$4,$5,'divers','en_attente',$6,$7,$8)
    RETURNING *`,
    [nom, code, adresse, heureDebut, heureFin, actor.id, motif, companyId],
  );

  await query(
    `INSERT INTO affectations_chantiers (user_id, chantier_id, date_debut, company_id)
     VALUES ($1, $2, CURRENT_DATE, $3)`,
    [actor.id, rows[0].id, companyId],
  );

  return { ...toFeChantierHours(rows[0]), reused_existing: false };
}

export async function approveChantierDivers(actor, input) {
  if (!isAdminRole(actor.role)) {
    throw new AppError('Acces refuse', 403);
  }

  const chantierId = input.p_chantier_id ?? input.chantier_id;
  const heureDebut = input.p_heure_debut ?? input.heure_debut;
  const heureFin = input.p_heure_fin ?? input.heure_fin;
  const nom = input.p_nom ?? input.nom;
  const adresse = input.p_adresse ?? input.adresse;

  if (!heureDebut || !heureFin || heureFin <= heureDebut) {
    throw new AppError('Horaires de chantier invalides', 400);
  }

  const { rows } = await query(`SELECT * FROM chantiers WHERE id = $1 FOR UPDATE`, [chantierId]);
  const row = rows[0];
  if (!row) throw new AppError('Chantier introuvable', 404);
  assertSameCompany(actor, row.company_id);
  if (row.source !== 'divers' || row.divers_statut !== 'en_attente') {
    throw new AppError('Ce chantier divers ne peut pas etre approuve', 400);
  }

  const { rows: updated } = await query(
    `UPDATE chantiers SET
      nom = coalesce(nullif(trim($1), ''), nom),
      adresse = coalesce(nullif(trim($2), ''), adresse),
      heure_debut_matin = $3,
      heure_fin_apres_midi = $4,
      actif = true,
      divers_statut = 'approuve',
      divers_reviewed_by = $5,
      divers_reviewed_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [nom ?? '', adresse ?? '', heureDebut, heureFin, actor.id, chantierId],
  );

  await query(
    `UPDATE declarations_heures SET updated_at = NOW()
     WHERE chantier_id = $1 AND statut IN ('soumise', 'brouillon')`,
    [chantierId],
  );

  return toFeChantierHours(updated[0]);
}

export async function rejectChantierDivers(actor, input) {
  if (!isAdminRole(actor.role)) {
    throw new AppError('Acces refuse', 403);
  }

  const chantierId = input.p_chantier_id ?? input.chantier_id;
  const reason = input.p_reason ?? input.reason ?? '';

  const { rows } = await query(`SELECT * FROM chantiers WHERE id = $1 FOR UPDATE`, [chantierId]);
  const row = rows[0];
  if (!row) throw new AppError('Chantier introuvable', 404);
  assertSameCompany(actor, row.company_id);
  if (row.source !== 'divers' || row.divers_statut !== 'en_attente') {
    throw new AppError('Ce chantier divers ne peut pas etre refuse', 400);
  }

  await query(`DELETE FROM periodes_travail WHERE chantier_id = $1`, [chantierId]);
  await query(
    `UPDATE declarations_heures SET statut = 'annulee', updated_at = NOW()
     WHERE chantier_id = $1 AND statut IN ('soumise', 'brouillon')`,
    [chantierId],
  );
  await query(
    `UPDATE chantiers SET actif = false, divers_statut = 'rejete',
      divers_rejection_reason = nullif(trim($1), ''),
      divers_reviewed_by = $2, divers_reviewed_at = NOW()
     WHERE id = $3`,
    [reason, actor.id, chantierId],
  );
}

/** Ouvrier notification feed — mirrors Supabase RPC get_collaborator_divers_notifications. */
export async function getCollaboratorDiversNotifications(actor, input = {}) {
  if (actor.role !== 'ouvrier') {
    return [];
  }

  const sinceRaw = input.p_since ?? input.since;
  const since =
    sinceRaw != null && String(sinceRaw).trim()
      ? String(sinceRaw)
      : new Date(Date.now() - 14 * 86400000).toISOString();

  const { rows } = await query(
    `SELECT * FROM get_collaborator_divers_notifications($1, $2::timestamptz)`,
    [actor.id, since],
  );

  return rows.map((row) => ({
    chantier_id: row.chantier_id,
    nom: row.nom,
    divers_statut: row.divers_statut,
    divers_reviewed_at: row.divers_reviewed_at,
    divers_rejection_reason: row.divers_rejection_reason,
    cancelled_shifts_count: Number(row.cancelled_shifts_count ?? 0),
  }));
}

export async function adminUpdateUserAuth(actor, input) {
  if (!isAdminRole(actor.role)) {
    throw new AppError('Acces refuse', 403);
  }

  const userId = input.user_id;
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (!userId) throw new AppError('user_id requis', 400);
  if (!email && !password) return { success: true };

  const { rows } = await query(`SELECT id FROM profiles WHERE id = $1 LIMIT 1`, [userId]);
  if (!rows[0]) throw new AppError('Utilisateur introuvable', 404);

  if (password) {
    if (password.length < 6) {
      throw new AppError('Le mot de passe doit contenir au moins 6 caractères', 400);
    }
    const hash = await bcrypt.hash(password, 10);
    await query(`UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      hash,
      userId,
    ]);
  }

  if (email) {
    await query(`UPDATE profiles SET email = $1, updated_at = NOW() WHERE id = $2`, [
      email,
      userId,
    ]);
  }

  return { success: true };
}
