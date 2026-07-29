/**
 * Dual Supabase public-table dump + provisional merge.
 * Reads service_role keys from FE `env` (mislabeled ANON_KEY). Never prints keys.
 * Output stays under this folder (gitignored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const ENV_PATH = path.join(
  ROOT,
  'chantier1/Chantier-web-app-main/Chantier-web-app-main/env',
);
const OUT = __dirname;

const PROJECTS = [
  {
    id: 'afgveikz',
    ref: 'afgveikzneaablcuzwdb',
    url: 'https://afgveikzneaablcuzwdb.supabase.co',
  },
  {
    id: 'hzppst',
    ref: 'hzppsttpzzeuslnpcdkv',
    url: 'https://hzppsttpzzeuslnpcdkv.supabase.co',
  },
];

/** CVL contract tables + common related public tables if present. */
const TABLES = [
  'profiles',
  'chantiers',
  'affectations_chantiers',
  'zones_equipe',
  'zones_chantiers',
  'zones_ouvriers',
  'periodes_travail',
  'declarations_heures',
];

function loadKeys() {
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const urls = [...raw.matchAll(/EXPO_PUBLIC_SUPABASE_URL=(\S+)/g)].map((m) =>
    m[1].trim(),
  );
  const keys = [...raw.matchAll(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(\S+)/g)].map((m) =>
    m[1].trim(),
  );
  if (urls.length < 2 || keys.length < 2) {
    throw new Error('Expected 2 URL/key pairs in env file');
  }
  /** Map short id (afgveikz / hzppst) → key via full project ref in URL. */
  const byShort = {};
  for (let i = 0; i < urls.length; i++) {
    const ref = new URL(urls[i]).hostname.split('.')[0];
    if (ref.startsWith('afgveikz')) byShort.afgveikz = keys[i];
    if (ref.startsWith('hzppst')) byShort.hzppst = keys[i];
  }
  return byShort;
}

async function fetchAll(base, key, table) {
  const pageSize = 1000;
  const rows = [];
  let from = 0;
  for (;;) {
    const to = from + pageSize - 1;
    const res = await fetch(`${base}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        Range: `${from}-${to}`,
      },
    });
    if (res.status === 404 || res.status === 406) {
      return { ok: false, status: res.status, rows: [] };
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${table} ${res.status}: ${body.slice(0, 200)}`);
    }
    const chunk = await res.json();
    if (!Array.isArray(chunk)) throw new Error(`${table}: unexpected payload`);
    rows.push(...chunk);
    const range = res.headers.get('content-range') || '';
    const totalMatch = range.match(/\/(\d+|\*)/);
    const total = totalMatch && totalMatch[1] !== '*' ? Number(totalMatch[1]) : null;
    if (chunk.length < pageSize) break;
    if (total != null && rows.length >= total) break;
    from += pageSize;
  }
  return { ok: true, status: 200, rows };
}

function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'object') {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function rowsToInsertSql(table, rows, extraCols = {}) {
  if (!rows.length) return `-- ${table}: 0 rows\n`;
  const cols = [...Object.keys(rows[0]), ...Object.keys(extraCols)];
  const lines = rows.map((r) => {
    const vals = cols.map((c) =>
      Object.prototype.hasOwnProperty.call(extraCols, c)
        ? sqlLiteral(extraCols[c])
        : sqlLiteral(r[c]),
    );
    return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
  });
  return `-- ${table}: ${rows.length} rows\n${lines.join('\n')}\n`;
}

async function dumpProject(project, key) {
  const bundle = {
    project: project.id,
    ref: project.ref,
    extracted_at: new Date().toISOString(),
    tables: {},
  };
  let sql = `-- Dump ${project.id} (${project.ref})\n-- extracted_at ${bundle.extracted_at}\n-- source: PostgREST service_role export (public tables only; no auth.users)\n\n`;

  for (const table of TABLES) {
    const { ok, status, rows } = await fetchAll(project.url, key, table);
    bundle.tables[table] = { ok, status, count: rows.length, rows };
    sql += `\n-- ==== ${table} (${ok ? rows.length : `SKIP ${status}`}) ====\n`;
    if (ok) sql += rowsToInsertSql(table, rows);
  }

  const jsonPath = path.join(OUT, `${project.id}.json`);
  const sqlPath = path.join(OUT, `${project.id}.sql`);
  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2));
  fs.writeFileSync(sqlPath, sql);
  return bundle;
}

/**
 * Provisional merge:
 * - Keep all rows with provenance _source_ref / _source_project
 * - profiles: same email (casefold) → keep first project's row, remap second id → winner
 * - other UUID PKs colliding across sources → remap second to new UUID and cascade known FKs
 */
function mergeBundles(a, b) {
  const sources = [a, b];
  const idMap = new Map(); // oldId -> newId
  const emailOwner = new Map(); // email -> profile id kept
  const audit = [];

  function mapId(id) {
    if (id == null) return id;
    return idMap.has(id) ? idMap.get(id) : id;
  }

  function registerId(id, preferred) {
    if (id == null) return preferred ?? id;
    if (!idMap.has(id)) idMap.set(id, preferred ?? id);
    return idMap.get(id);
  }

  // Pass 1: profiles / emails
  const mergedProfiles = [];
  const seenProfileIds = new Set();

  for (const src of sources) {
    const rows = src.tables.profiles?.rows || [];
    for (const row of rows) {
      const email = (row.email || '').trim().toLowerCase();
      const tagged = {
        ...row,
        _source_project: src.project,
        _source_ref: src.ref,
      };
      if (email && emailOwner.has(email)) {
        const winner = emailOwner.get(email);
        if (row.id !== winner) {
          idMap.set(row.id, winner);
          audit.push({
            type: 'profile_email_collision',
            email,
            discarded_id: row.id,
            kept_id: winner,
            discarded_source: src.project,
          });
        }
        continue;
      }
      if (seenProfileIds.has(row.id)) {
        const neu = randomUUID();
        idMap.set(row.id, neu);
        tagged.id = neu;
        audit.push({
          type: 'profile_uuid_collision',
          old_id: row.id,
          new_id: neu,
          source: src.project,
        });
      } else {
        seenProfileIds.add(row.id);
        registerId(row.id, row.id);
      }
      if (email) emailOwner.set(email, tagged.id);
      mergedProfiles.push(tagged);
    }
  }

  function mergeTable(name, pk = 'id', fkRewrites = []) {
    const out = [];
    const seenPk = new Set();
    for (const src of sources) {
      const rows = src.tables[name]?.rows || [];
      for (const row of rows) {
        const copy = {
          ...row,
          _source_project: src.project,
          _source_ref: src.ref,
        };
        // Remap known user FKs first
        for (const fk of fkRewrites) {
          if (copy[fk] != null) copy[fk] = mapId(copy[fk]);
        }
        let pkVal = copy[pk];
        if (pkVal != null && seenPk.has(pkVal)) {
          const neu = randomUUID();
          idMap.set(row[pk], neu);
          copy[pk] = neu;
          audit.push({
            type: `${name}_uuid_collision`,
            old_id: row[pk],
            new_id: neu,
            source: src.project,
          });
          pkVal = neu;
        }
        if (pkVal != null) {
          seenPk.add(pkVal);
          registerId(row[pk], pkVal);
        }
        out.push(copy);
      }
    }
    return out;
  }

  // Order matters for FK remap
  const chantiers = mergeTable('chantiers', 'id');
  const zones = mergeTable('zones_equipe', 'id', ['chef_equipe_id']);
  const affectations = mergeTable('affectations_chantiers', 'id', [
    'user_id',
    'chef_equipe_id',
  ]);
  // zone links may use composite nature; still have optional id
  const zonesChantiers = mergeTable('zones_chantiers', 'id', []);
  for (const r of zonesChantiers) {
    r.zone_id = mapId(r.zone_id);
    r.chantier_id = mapId(r.chantier_id);
  }
  const zonesOuvriers = mergeTable('zones_ouvriers', 'id', ['user_id']);
  for (const r of zonesOuvriers) {
    r.zone_id = mapId(r.zone_id);
  }
  const periods = mergeTable('periodes_travail', 'id', ['user_id', 'validated_by']);
  for (const r of periods) {
    r.chantier_id = mapId(r.chantier_id);
  }
  const decls = mergeTable('declarations_heures', 'id', [
    'user_id',
    'validated_by',
  ]);
  for (const r of decls) {
    r.chantier_id = mapId(r.chantier_id);
  }
  // Fix chantier_id remap on affectations
  for (const r of affectations) {
    r.chantier_id = mapId(r.chantier_id);
  }

  const merged = {
    merged_at: new Date().toISOString(),
    sources: sources.map((s) => ({
      project: s.project,
      ref: s.ref,
      extracted_at: s.extracted_at,
      counts: Object.fromEntries(
        Object.entries(s.tables).map(([t, v]) => [t, v.count ?? 0]),
      ),
    })),
    audit,
    id_remap_count: [...idMap.entries()].filter(([a, b]) => a !== b).length,
    tables: {
      profiles: mergedProfiles,
      chantiers,
      zones_equipe: zones,
      affectations_chantiers: affectations,
      zones_chantiers: zonesChantiers,
      zones_ouvriers: zonesOuvriers,
      periodes_travail: periods,
      declarations_heures: decls,
    },
  };

  // SQL without provenance cols that may not exist in target DDL
  let sql = `-- MERGED dump afgveikz + hzppst\n-- merged_at ${merged.merged_at}\n-- PROVISIONAL: email collisions remapped; see merged_audit.json\n-- NOT a production ETL; for analysis / staging import only\n\n`;
  for (const [table, rows] of Object.entries(merged.tables)) {
    const cleaned = rows.map(({ _source_project, _source_ref, ...rest }) => rest);
    sql += `\n-- ==== ${table} (${cleaned.length}) ====\n`;
    sql += rowsToInsertSql(table, cleaned);
  }

  return { merged, sql };
}

async function main() {
  const keys = loadKeys();
  const dumps = [];
  for (const p of PROJECTS) {
    const key = keys[p.id];
    if (!key) throw new Error(`Missing key for ${p.id}`);
    console.log(`Dumping ${p.id}...`);
    dumps.push(await dumpProject(p, key));
  }

  console.log('Merging...');
  const { merged, sql } = mergeBundles(dumps[0], dumps[1]);
  fs.writeFileSync(path.join(OUT, 'merged.json'), JSON.stringify(merged, null, 2));
  fs.writeFileSync(path.join(OUT, 'merged.sql'), sql);
  fs.writeFileSync(
    path.join(OUT, 'merged_audit.json'),
    JSON.stringify(
      {
        merged_at: merged.merged_at,
        sources: merged.sources,
        id_remap_count: merged.id_remap_count,
        audit: merged.audit,
        counts: Object.fromEntries(
          Object.entries(merged.tables).map(([t, rows]) => [t, rows.length]),
        ),
      },
      null,
      2,
    ),
  );

  console.log('Done.');
  console.log(
    JSON.stringify(
      {
        files: [
          'afgveikz.json',
          'afgveikz.sql',
          'hzppst.json',
          'hzppst.sql',
          'merged.json',
          'merged.sql',
          'merged_audit.json',
        ],
        per_source: merged.sources,
        merged_counts: Object.fromEntries(
          Object.entries(merged.tables).map(([t, rows]) => [t, rows.length]),
        ),
        audit_events: merged.audit.length,
        id_remaps: merged.id_remap_count,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
