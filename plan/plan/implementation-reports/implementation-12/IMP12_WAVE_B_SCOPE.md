# IMP12_WAVE_B_SCOPE.md

**Date:** 2026-07-15  
**Mode:** Investigation — no code  
**Wave A:** COMPLETE — not re-scoped here  

---

## Mission (Wave B)

Finish Imp-12 compatibility adapters still required after Wave A so frozen FE table (and gated auth) contracts can call **existing** Imp-02…11 services — thin translate only.

---

## IN (candidate Wave B)

| Item | Class |
|---|---|
| `/tables/chantiers` GET/POST/PATCH | READY |
| `/tables/affectations_chantiers` GET/POST/PATCH(soft) | READY |
| `/tables/zones_equipe` CRUD | READY |
| `/tables/zones_chantiers` insert/delete | READY |
| `/tables/zones_ouvriers` insert/patch | READY |
| `/tables/periodes_travail` allow-list CRUD | READY |
| `/tables/declarations_heures` GET | READY |
| Optional dual `/rest/v1/{table}` mounts | BLOCKED (DR) |
| Declarations UPDATE → Imp-07 command map | BLOCKED (DR-003) |
| Auth/session GoTrue-shaped adapter | BLOCKED (DR-004) |

---

## OUT / NOT IMP-12

| Item | Owner |
|---|---|
| Supabase Realtime protocol bridge | Imp-09 / cutover |
| Imp-08 export business | Imp-08 |
| Imp-11 admin business / migrations | Imp-11 CLOSED |
| Imp-10 jobs | Imp-10 CLOSED |
| Imp-13 / Phase 11 ETL | Imp-13 |
| Full PostgREST clone | Forbidden |
| SQL migrations | Forbidden Imp-12 |
| FE edits | Frozen |
| Inactive auto-approve RPC | OUT |
| Super Admin | OUT |

---

## FORBIDDEN (unchanged from Wave A)

- Rewrite Imp-02…11 business  
- Duplicate lifecycle/cascade/sync/decide logic  
- SQL / ALTER  
- Invent permissions  
- Second write path for periods/declarations  

---

## REUSE

Imp-02 auth middleware · Imp-04 chantiers · Imp-05 affectations/zones · Imp-06 timesheet · Imp-07 validation decide APIs · Imp-03/11 only if profiles gaps (Wave A already covers profiles).

---

## DEFERRED

| Item | Note |
|---|---|
| Realtime protocol bridge | Not Imp-12 default |
| Full PostgREST filter grammar | Allow-list subset only |
| Wave A closed choices unless Human reopens | DR-003, DR-004 |

---

Coding: **blocked** until Human review + Wave B DRs answered (separate step).
