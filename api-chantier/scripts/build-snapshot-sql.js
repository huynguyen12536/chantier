/**
 * Build seeds/current-snapshot.sql from pg_dump raw file.
 * Idempotent: TRUNCATE business tables then INSERT snapshot rows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, '../seeds');
const rawPath = path.join(seedsDir, 'current-snapshot.raw.sql');
const outPath = path.join(seedsDir, 'current-snapshot.sql');

let raw = fs.readFileSync(rawPath, 'utf8');
raw = raw.replace(/^\\restrict.*$/gm, '');

const header = `-- Current local DB snapshot (business tables)
-- Generated: ${new Date().toISOString()}
-- Source: chantier-db / database chantier
-- Usage: npm run migrate && npm run seed:snapshot
--
-- Idempotent reload: wipe business rows then insert snapshot.

BEGIN;

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
RESTART IDENTITY CASCADE;

`;

const lines = raw.split(/\r?\n/);
const keep = [];
let inInsert = false;
for (const line of lines) {
  if (line.startsWith('INSERT INTO')) {
    inInsert = true;
    keep.push(line);
    continue;
  }
  if (inInsert) {
    keep.push(line);
    if (line.trim().endsWith(';')) inInsert = false;
    continue;
  }
  if (line.startsWith('-- Data for Name:')) keep.push(line);
}

const out = `${header}${keep.join('\n')}\n\nCOMMIT;\n`;
fs.writeFileSync(outPath, out, 'utf8');
console.log(
  JSON.stringify(
    {
      out: outPath,
      bytes: out.length,
      inserts: (out.match(/^INSERT INTO/gm) || []).length,
    },
    null,
    2,
  ),
);
