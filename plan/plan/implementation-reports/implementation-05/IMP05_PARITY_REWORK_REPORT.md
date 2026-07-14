# IMP05_PARITY_REWORK_REPORT

| Field | Value |
|---|---|
| Status | **PASS** |
| Date | 2026-07-14 |
| Reviewed commit | `266efc4f8c` |
| Rule | Unified PostgreSQL = **UNION** of both legacy Supabase DBs — no destructive loss |

## 1. Every DROP found

| Location | Statement |
|---|---|
| `006_imp05_parity.sql` (in `266efc4f8c`) | `ALTER TABLE zones_ouvriers DROP CONSTRAINT IF EXISTS zones_ouvriers_zone_id_user_id_key;` |

No other `DROP TABLE/COLUMN/CONSTRAINT/INDEX`, no `RENAME`, no destructive `ALTER COLUMN` in that commit’s SQL.

## 2. Why it was originally added

Parity task asked to match CVL production dump: if `UNIQUE(zone_id,user_id)` was absent, remove it.

Agent compared:
- `migration-analysis/production-dump/01_public_schema.sql` — `zones_ouvriers` has **PK only**, no UNIQUE
- `004_affectations_zones.sql` — had UNIQUE

Conclusion at the time: “invented vs dump → drop”.

## 3. Why it was removed (rework)

Under Consolidation + Replatforming:

- Unified DB is **not** a clone of dump-only schema.
- UNIQUE already existed in Unified Platform migration **004** (application SoT layer).
- Dump (hzppst / “one legacy”) lacking UNIQUE is **not** proof the constraint is obsolete.
- FE Contract / Flow C soft-membership benefits from one active row key; UNIQUE supports that.
- **No Decision Log** authorized destruction.

→ Destructive DROP was an **assumption**, forbidden.

## 4. Replacement strategy

| Action | Detail |
|---|---|
| Edit `006_imp05_parity.sql` | Remove DROP; keep only ADD CHECK / INDEX / COLUMN |
| Add `007_imp05_parity_rework_restore_unique.sql` | **ADD** UNIQUE back if missing (idempotent) for DBs that already ran old 006 |
| App logic | Keep soft-end + restore via UPDATE; compatible with UNIQUE |
| Decision Log | Record: UNIQUE kept (UNION / 004); DROP never again without DL |

## 5. Evidence — migration-analysis

| Source | Says |
|---|---|
| `production-dump/01_public_schema.sql` | No UNIQUE on `zones_ouvriers` |
| `database-schema.md` | Zones notes FK CASCADE/RESTRICT drift; does **not** order dropping UNIQUE |
| Merge Spec / Unified Domain | Preserve information; resolve conflicts via Decision Log — not silent DROP |
| Consolidation rule (this directive) | If A has X and B does not → do **not** auto-remove |

## 6. Evidence — both legacy / unified layers

| Layer | UNIQUE(zone_id, user_id)? |
|---|---|
| Verified dump (hzppst) | Absent |
| Repo create migrations (`20260618071028_create_zones_equipe_tables.sql`) | Absent |
| Unified Imp-05 `004_affectations_zones.sql` | **Present** (platform table create) |
| Decision | **Keep** (UNION: do not destroy 004 information; dump gap ≠ authorize DROP) |

## 7. Final SQL changes

### `006_imp05_parity.sql` (non-destructive)

```sql
-- ADD CHECK valid_affectation_date_range (idempotent)
-- CREATE INDEX IF NOT EXISTS idx_affectations_chef
-- CREATE INDEX IF NOT EXISTS idx_affectations_dates
-- ADD COLUMN IF NOT EXISTS zones_equipe.description
-- (no DROP)
```

### `007_imp05_parity_rework_restore_unique.sql` (additive restore)

```sql
-- ADD CONSTRAINT zones_ouvriers_zone_id_user_id_key UNIQUE (zone_id, user_id)
-- EXCEPTION duplicate_object → no-op
```

## Validation

| Gate | Result |
|---|---|
| Full `npm test` | **31/31 PASS** |
| Architecture | Migrations additive-only |
| Business | Soft membership + UNIQUE preserved |
| Regression | Imp-01…08 green |

## Commit

`f40a896a4a565b026d952962b42b34652cfd10ed`
