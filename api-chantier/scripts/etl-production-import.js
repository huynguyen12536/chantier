#!/usr/bin/env node
/**
 * Phase 15 — Production data migration (ETL).
 * Source of truth: migration-analysis/data-dumps/merged.json (offline artifact only).
 * Does NOT connect to live Supabase. Does NOT rewrite business services / APIs.
 *
 * Password policy:
 * - If a profile row includes password_hash / encrypted_password → reuse it.
 * - Else assign documented temporary password (MIGRATION_TEMP_PASSWORD) and list in report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool, withTransaction } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import { runMigrations } from '../src/db/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MERGED_PATH =
  process.env.MERGED_JSON_PATH ||
  path.join(ROOT, 'migration-analysis/data-dumps/merged.json');
const REPORT_DIR =
  process.env.ETL_REPORT_DIR ||
  path.join(ROOT, 'plan/plan/implementation-reports/implementation-15');

const SYSTEM_AUTO_APPROVE_ID = '00000000-0000-4000-8000-000000000001';
const TEMP_PASSWORD = process.env.MIGRATION_TEMP_PASSWORD || 'Phase15-TempPass!';

const BUSINESS_TABLES = [
  'profiles',
  'chantiers',
  'affectations_chantiers',
  'zones_equipe',
  'zones_chantiers',
  'zones_ouvriers',
  'periodes_travail',
  'declarations_heures',
];

function stripMeta(row) {
  const out = { ...row };
  delete out._source_project;
  delete out._source_ref;
  return out;
}

function mapChantierHours(row) {
  const heureDebut = row.heure_debut ?? row.heure_debut_matin ?? null;
  const heureFin = row.heure_fin ?? row.heure_fin_apres_midi ?? row.heure_fin_matin ?? null;
  return {
    heure_debut_matin: row.heure_debut_matin ?? heureDebut,
    heure_fin_matin: row.heure_fin_matin ?? heureFin,
    heure_debut_apres_midi: row.heure_debut_apres_midi ?? null,
    heure_fin_apres_midi: row.heure_fin_apres_midi ?? heureFin,
  };
}

async function wipeBusinessData(client) {
  await client.query(`
    TRUNCATE TABLE
      approval_audit_events,
      refresh_tokens,
      periodes_travail,
      declarations_heures,
      zones_ouvriers,
      zones_chantiers,
      zones_equipe,
      affectations_chantiers,
      chantiers,
      profiles
    RESTART IDENTITY CASCADE
  `);
}

async function ensureSystemActor(client, passwordHash) {
  await client.query(
    `INSERT INTO profiles (id, email, password_hash, role, nom, prenom, phone, actif)
     VALUES ($1, $2, $3, 'admin', 'System', 'AutoApprove', '', TRUE)
     ON CONFLICT (id) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       actif = TRUE`,
    [SYSTEM_AUTO_APPROVE_ID, 'system.auto-approve@platform.local', passwordHash],
  );
}

async function insertProfiles(client, profiles, tempHash) {
  const passwordReport = [];
  for (const raw of profiles) {
    const p = stripMeta(raw);
    const existingHash = p.password_hash || p.encrypted_password || null;
    const usedTemp = !existingHash;
    const password_hash = existingHash || tempHash;
    passwordReport.push({
      id: p.id,
      email: p.email,
      role: p.role,
      reason: usedTemp
        ? 'password_hash unavailable in merged dump (auth.users not extracted)'
        : 'reused password_hash from dump',
      temporary_password: usedTemp ? TEMP_PASSWORD : null,
    });
    const matricule =
      p.matricule == null || String(p.matricule).trim() === '' ? null : String(p.matricule);
    await client.query(
      `INSERT INTO profiles (
         id, email, password_hash, role, nom, prenom, matricule, phone, actif, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4::profile_role,$5,$6,$7,COALESCE($8,''),COALESCE($9,TRUE),$10,$11
       )`,
      [
        p.id,
        p.email,
        password_hash,
        p.role,
        p.nom ?? null,
        p.prenom ?? null,
        matricule,
        p.phone ?? '',
        p.actif ?? true,
        p.created_at ?? new Date().toISOString(),
        p.updated_at ?? p.created_at ?? new Date().toISOString(),
      ],
    );
  }
  return passwordReport;
}

async function insertChantiers(client, rows) {
  for (const raw of rows) {
    const c = stripMeta(raw);
    const hours = mapChantierHours(c);
    await client.query(
      `INSERT INTO chantiers (
         id, code, nom, adresse, date_debut, date_fin,
         heure_debut_matin, heure_fin_matin, heure_debut_apres_midi, heure_fin_apres_midi,
         actif, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11,TRUE),$12,$13
       )`,
      [
        c.id,
        c.code,
        c.nom,
        c.adresse ?? null,
        c.date_debut ?? null,
        c.date_fin ?? null,
        hours.heure_debut_matin,
        hours.heure_fin_matin,
        hours.heure_debut_apres_midi,
        hours.heure_fin_apres_midi,
        c.actif ?? true,
        c.created_at ?? new Date().toISOString(),
        c.updated_at ?? c.created_at ?? new Date().toISOString(),
      ],
    );
  }
}

async function insertAffectations(client, rows) {
  for (const raw of rows) {
    const a = stripMeta(raw);
    await client.query(
      `INSERT INTO affectations_chantiers (
         id, user_id, chantier_id, chef_equipe_id, date_debut, date_fin, created_at
       ) VALUES ($1,$2,$3,$4,COALESCE($5::date, CURRENT_DATE),$6::date,$7)`,
      [
        a.id,
        a.user_id,
        a.chantier_id,
        a.chef_equipe_id ?? null,
        a.date_debut ?? null,
        a.date_fin ?? null,
        a.created_at ?? new Date().toISOString(),
      ],
    );
  }
}

async function insertZonesEquipe(client, rows) {
  for (const raw of rows) {
    const z = stripMeta(raw);
    await client.query(
      `INSERT INTO zones_equipe (id, nom, description, chef_equipe_id, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        z.id,
        z.nom,
        z.description ?? null,
        z.chef_equipe_id,
        z.created_at ?? new Date().toISOString(),
      ],
    );
  }
}

async function insertZonesChantiers(client, rows) {
  for (const raw of rows) {
    const z = stripMeta(raw);
    await client.query(
      `INSERT INTO zones_chantiers (id, zone_id, chantier_id) VALUES ($1,$2,$3)`,
      [z.id, z.zone_id, z.chantier_id],
    );
  }
}

async function insertZonesOuvriers(client, rows) {
  for (const raw of rows) {
    const z = stripMeta(raw);
    await client.query(
      `INSERT INTO zones_ouvriers (id, zone_id, user_id, date_debut, date_fin)
       VALUES ($1,$2,$3,COALESCE($4::date, CURRENT_DATE),$5::date)`,
      [z.id, z.zone_id, z.user_id, z.date_debut ?? null, z.date_fin ?? null],
    );
  }
}

async function insertPeriodes(client, rows) {
  for (const raw of rows) {
    const p = stripMeta(raw);
    const panier = p.panier ?? p.panier_repas ?? false;
    const latitude = p.latitude ?? p.latitude_debut ?? null;
    const longitude = p.longitude ?? p.longitude_debut ?? null;
    await client.query(
      `INSERT INTO periodes_travail (
         id, user_id, chantier_id, date, heure_debut, heure_fin,
         latitude, longitude, panier, deplacement, from_suggestion, statut,
         validated_by, validated_at, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,FALSE),COALESCE($10,FALSE),COALESCE($11,FALSE),
         COALESCE($12,'terminee'),$13,$14,$15,$16
       )`,
      [
        p.id,
        p.user_id,
        p.chantier_id,
        p.date,
        p.heure_debut,
        p.heure_fin ?? null,
        latitude,
        longitude,
        panier,
        p.deplacement ?? false,
        p.from_suggestion ?? false,
        p.statut,
        p.validated_by ?? null,
        p.validated_at ?? null,
        p.created_at ?? new Date().toISOString(),
        p.updated_at ?? p.created_at ?? new Date().toISOString(),
      ],
    );
  }
}

async function insertDeclarations(client, rows) {
  for (const raw of rows) {
    const d = stripMeta(raw);
    await client.query(
      `INSERT INTO declarations_heures (
         id, user_id, chantier_id, date,
         heures_normales, heures_supplementaires, nb_paniers, nb_deplacements,
         from_suggestion, statut, validated_by, validated_at, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,COALESCE($7,0),COALESCE($8,0),COALESCE($9,FALSE),
         COALESCE($10,'soumise'),$11,$12,$13,$14
       )`,
      [
        d.id,
        d.user_id,
        d.chantier_id,
        d.date,
        d.heures_normales ?? 0,
        d.heures_supplementaires ?? 0,
        d.nb_paniers ?? 0,
        d.nb_deplacements ?? 0,
        d.from_suggestion ?? false,
        d.statut,
        d.validated_by ?? null,
        d.validated_at ?? null,
        d.created_at ?? new Date().toISOString(),
        d.updated_at ?? d.created_at ?? new Date().toISOString(),
      ],
    );
  }
}

async function countTable(name) {
  const { rows } = await query(`SELECT COUNT(*)::int AS c FROM ${name}`);
  return rows[0].c;
}

async function validateFk() {
  const checks = [];
  const q = async (label, sql) => {
    const { rows } = await query(sql);
    checks.push({ label, orphan_count: Number(rows[0].c) });
  };
  await q(
    'affectations.user_id',
    `SELECT COUNT(*)::int AS c FROM affectations_chantiers a
     LEFT JOIN profiles p ON p.id = a.user_id WHERE p.id IS NULL`,
  );
  await q(
    'affectations.chantier_id',
    `SELECT COUNT(*)::int AS c FROM affectations_chantiers a
     LEFT JOIN chantiers c ON c.id = a.chantier_id WHERE c.id IS NULL`,
  );
  await q(
    'affectations.chef_equipe_id',
    `SELECT COUNT(*)::int AS c FROM affectations_chantiers a
     LEFT JOIN profiles p ON p.id = a.chef_equipe_id
     WHERE a.chef_equipe_id IS NOT NULL AND p.id IS NULL`,
  );
  await q(
    'periodes.user_id',
    `SELECT COUNT(*)::int AS c FROM periodes_travail x
     LEFT JOIN profiles p ON p.id = x.user_id WHERE p.id IS NULL`,
  );
  await q(
    'periodes.chantier_id',
    `SELECT COUNT(*)::int AS c FROM periodes_travail x
     LEFT JOIN chantiers c ON c.id = x.chantier_id WHERE c.id IS NULL`,
  );
  await q(
    'periodes.validated_by',
    `SELECT COUNT(*)::int AS c FROM periodes_travail x
     LEFT JOIN profiles p ON p.id = x.validated_by
     WHERE x.validated_by IS NOT NULL AND p.id IS NULL`,
  );
  await q(
    'declarations.user_id',
    `SELECT COUNT(*)::int AS c FROM declarations_heures x
     LEFT JOIN profiles p ON p.id = x.user_id WHERE p.id IS NULL`,
  );
  await q(
    'declarations.chantier_id',
    `SELECT COUNT(*)::int AS c FROM declarations_heures x
     LEFT JOIN chantiers c ON c.id = x.chantier_id WHERE c.id IS NULL`,
  );
  await q(
    'declarations.validated_by',
    `SELECT COUNT(*)::int AS c FROM declarations_heures x
     LEFT JOIN profiles p ON p.id = x.validated_by
     WHERE x.validated_by IS NOT NULL AND p.id IS NULL`,
  );
  return checks;
}

async function compareIds(table, mergedIds) {
  const { rows } = await query(`SELECT id FROM ${table}`);
  const local = new Set(rows.map((r) => r.id));
  const merged = new Set(mergedIds);
  return {
    merged_count: merged.size,
    local_count: local.size,
    matching: [...merged].filter((id) => local.has(id)).length,
    only_in_merged: [...merged].filter((id) => !local.has(id)),
    only_in_local: [...local].filter(
      (id) => !merged.has(id) && id !== SYSTEM_AUTO_APPROVE_ID,
    ),
  };
}

async function main() {
  if (!fs.existsSync(MERGED_PATH)) {
    throw new Error(`merged.json not found at ${MERGED_PATH}`);
  }
  const merged = JSON.parse(fs.readFileSync(MERGED_PATH, 'utf8'));
  const tables = merged.tables || {};
  for (const name of BUSINESS_TABLES) {
    if (!Array.isArray(tables[name])) {
      throw new Error(`merged.tables.${name} missing or not an array`);
    }
  }

  await runMigrations();
  const tempHash = await hashPassword(TEMP_PASSWORD);
  const systemHash = await hashPassword('locked-system-actor-not-for-login');

  const passwordReport = await withTransaction(async (client) => {
    await wipeBusinessData(client);
    await ensureSystemActor(client, systemHash);
    const pw = await insertProfiles(client, tables.profiles, tempHash);
    await insertChantiers(client, tables.chantiers);
    await insertAffectations(client, tables.affectations_chantiers);
    await insertZonesEquipe(client, tables.zones_equipe);
    await insertZonesChantiers(client, tables.zones_chantiers);
    await insertZonesOuvriers(client, tables.zones_ouvriers);
    await insertPeriodes(client, tables.periodes_travail);
    await insertDeclarations(client, tables.declarations_heures);
    return pw;
  });

  const counts = {};
  for (const name of BUSINESS_TABLES) {
    counts[name] = {
      merged: tables[name].length,
      local: await countTable(name),
    };
  }
  counts.profiles.local_business = counts.profiles.local - 1;
  counts.profiles.system_actor_kept = true;

  const fk = await validateFk();
  const uuidCompare = {};
  for (const name of BUSINESS_TABLES) {
    uuidCompare[name] = await compareIds(
      name,
      tables[name].map((r) => r.id),
    );
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const artifact = {
    imported_at: new Date().toISOString(),
    merged_at: merged.merged_at,
    merged_path: MERGED_PATH,
    id_remap_count: merged.id_remap_count ?? 0,
    audit: merged.audit ?? [],
    temporary_password_policy: {
      env: 'MIGRATION_TEMP_PASSWORD',
      value_used: TEMP_PASSWORD,
      note: 'Assigned only when password_hash missing from dump. Documented — not silent.',
    },
    password_report: passwordReport,
    row_counts: counts,
    fk_orphans: fk,
    uuid_compare: uuidCompare,
    note_jasmine_ad:
      'jasmine.ad@gmail.com is NOT present in merged.json; migrated jasmine.* accounts: jasmine.n@gmail.com, jasmine.tl@gmail.com, jasmine.collab@gmail.com',
  };
  const outJson = path.join(REPORT_DIR, 'PHASE15_ETL_ARTIFACT.json');
  fs.writeFileSync(outJson, JSON.stringify(artifact, null, 2));

  console.log(
    JSON.stringify(
      {
        ok: true,
        reports: outJson,
        row_counts: counts,
        password_temp_accounts: passwordReport.filter((p) => p.temporary_password).length,
        password_reused: passwordReport.filter((p) => !p.temporary_password).length,
        temp_password: TEMP_PASSWORD,
        fk_orphans_total: fk.reduce((s, x) => s + x.orphan_count, 0),
        uuid_missing_total: Object.values(uuidCompare).reduce(
          (s, x) => s + x.only_in_merged.length,
          0,
        ),
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
    await closePool();
  });
