# PHASE15 — Data Migration Report

**Date:** 2026-07-15  
**Source:** `migration-analysis/data-dumps/merged.json` (`merged_at` 2026-07-15T06:33:54.751Z)  
**Target:** Local Docker Postgres `chantier` @ localhost:5432

## Sources in merge

| Project | Ref | profiles | chantiers | affectations | periodes | declarations |
|---|---|---:|---:|---:|---:|---:|
| afgveikz | afgveikzneaablcuzwdb | 5 | 3 | 6 | 16 | 16 |
| hzppst | hzppsttpzzeuslnpcdkv | 5 | 3 | 6 | 25 | 25 |
| **merged** | — | **9** | **6** | **12** | **41** | **41** |

(1 profile collision discarded per audit → 9 unique profiles.)

## Actions performed

1. Ensured migrations 001–010 applied.  
2. Wiped demo/test residue (974 prior profiles → replaced).  
3. Loaded merged business rows with original UUIDs.  
4. Kept platform system actor only as extra profile.  
5. Assigned temporary passwords where hashes absent.

## Demo seed status

| Item | Status |
|---|---|
| `@local.test` demo users | **Removed** (0 rows) |
| `seed:local` | Available for **dev only** |
| Production path | `seed:production-import` |

## Known artifact gap

`jasmine.ad@gmail.com` is **not** in `merged.json`. Present jasmine accounts:

- `jasmine.n@gmail.com` (chef_equipe)  
- `jasmine.tl@gmail.com` (chef_equipe)  
- `jasmine.collab@gmail.com` (ouvrier)

No invented rows were created for missing emails.
