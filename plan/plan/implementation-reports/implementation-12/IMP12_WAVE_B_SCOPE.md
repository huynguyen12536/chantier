# IMP12_WAVE_B_SCOPE.md

**Date:** 2026-07-15  
**Status:** **DELIVERED** — Wave B complete; Imp-12 **COMPLETE**  
**Runtime head:** `d8bb5c83c0`  
**Wave A:** COMPLETE — not re-scoped here  

---

## Mission (Wave B) — fulfilled

Finish Imp-12 compatibility adapters still required after Wave A so frozen FE table and auth contracts call **existing** Imp-02…11 services — thin translate only.

---

## IN (delivered)

| Item | Final class |
|---|---|
| `/tables` + `/rest/v1` chantiers GET/POST/PATCH | **DELIVERED** |
| `/tables` + `/rest/v1` affectations_chantiers GET/POST/PATCH(soft) | **DELIVERED** (B-005=B) |
| `/tables` + `/rest/v1` zones_equipe CRUD | **DELIVERED** |
| `/tables` + `/rest/v1` zones_chantiers insert/delete | **DELIVERED** |
| `/tables` + `/rest/v1` zones_ouvriers insert/patch | **DELIVERED** |
| `/tables` + `/rest/v1` periodes_travail allow-list CRUD | **DELIVERED** |
| `/tables` + `/rest/v1` declarations_heures GET | **DELIVERED** (B-003=C) |
| Dual `/rest/v1/{table}` mounts | **DELIVERED** (B-002=A) |
| Thin auth `/auth/v1` | **DELIVERED** (B-004=A) |
| Declarations UPDATE → Imp-07 | **DEFERRED** (B-003=C) |

---

## OUT / NOT IMP-12

| Item | Owner |
|---|---|
| Supabase Realtime protocol bridge | Imp-09 / cutover (**B-006=B**) |
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

## FORBIDDEN (unchanged)

- Rewrite Imp-02…11 business  
- Duplicate lifecycle/cascade/sync/decide logic  
- SQL / ALTER  
- Invent permissions  
- Second write path for periods/declarations  

---

## REUSE (as implemented)

Imp-02 auth · Imp-04 chantiers · Imp-05 affectations/zones · Imp-06 timesheet · Imp-03/11 profiles (Wave A + dual mount).

---

## DEFERRED (sealed)

| Item | DR |
|---|---|
| Declarations statut UPDATE adapter | B-003=C |
| Realtime protocol bridge | B-006=B |
| Affectation upsert invent | B-005=B |

Coding: **complete**. Module Imp-12 **COMPLETE**. No further Imp-12 production code without new Human authorization.
