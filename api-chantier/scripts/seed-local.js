#!/usr/bin/env node
/**
 * DR-P13-006=A — local demo seed (hashed passwords via Imp-02 hashPassword).
 * Idempotent on email conflict.
 */
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';

const PASSWORD = process.env.SEED_PASSWORD || 'Password123!';

const USERS = [
  { email: 'admin@local.test', role: 'admin', nom: 'Admin', prenom: 'Local' },
  { email: 'chef@local.test', role: 'chef_equipe', nom: 'Chef', prenom: 'Local' },
  { email: 'ouvrier@local.test', role: 'ouvrier', nom: 'Ouvrier', prenom: 'Local' },
  {
    email: 'administratif@local.test',
    role: 'administratif',
    nom: 'Admin',
    prenom: 'Istratif',
  },
];

async function upsertUser({ email, role, nom, prenom }, passwordHash) {
  const { rows } = await query(
    `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone, actif)
     VALUES ($1,$2,$3,$4,$5,'', TRUE)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       nom = EXCLUDED.nom,
       prenom = EXCLUDED.prenom,
       actif = TRUE
     RETURNING id, email, role`,
    [email, passwordHash, role, nom, prenom],
  );
  return rows[0];
}

async function ensureChantier(chefId) {
  const existing = await query(`SELECT id, code FROM chantiers WHERE code = 'C0001' LIMIT 1`);
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query(
    `INSERT INTO chantiers (
       code, nom, adresse, date_debut,
       heure_debut_matin, heure_fin_matin, heure_debut_apres_midi, heure_fin_apres_midi, actif
     ) VALUES (
       'C0001', 'Chantier Local Demo', '1 rue Locale', CURRENT_DATE,
       '07:30', '12:00', '13:00', '16:45', TRUE
     ) RETURNING id, code`,
  );
  return rows[0];
}

async function ensureAffectation(userId, chantierId, chefId) {
  await query(
    `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin)
     VALUES ($1,$2,$3, CURRENT_DATE, NULL)
     ON CONFLICT (user_id, chantier_id) DO UPDATE SET
       chef_equipe_id = EXCLUDED.chef_equipe_id,
       date_fin = NULL,
       date_debut = COALESCE(affectations_chantiers.date_debut, CURRENT_DATE)`,
    [userId, chantierId, chefId],
  );
}

async function main() {
  await runMigrations();
  const hash = await hashPassword(PASSWORD);
  const created = [];
  for (const u of USERS) {
    created.push(await upsertUser(u, hash));
  }
  const byEmail = Object.fromEntries(created.map((u) => [u.email, u]));
  const chantier = await ensureChantier(byEmail['chef@local.test'].id);
  await ensureAffectation(
    byEmail['chef@local.test'].id,
    chantier.id,
    byEmail['chef@local.test'].id,
  );
  await ensureAffectation(
    byEmail['ouvrier@local.test'].id,
    chantier.id,
    byEmail['chef@local.test'].id,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        password: PASSWORD,
        users: created.map((u) => ({ email: u.email, role: u.role, id: u.id })),
        chantier,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
