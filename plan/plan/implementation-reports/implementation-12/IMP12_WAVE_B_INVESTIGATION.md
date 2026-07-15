# IMP12_WAVE_B_INVESTIGATION.md

**Date:** 2026-07-15  
**Mode:** Investigation ONLY — **no production code**  
**Prerequisite:** Imp-12 Wave A **COMPLETE** (`a706e1111f`)  
**Mission:** Enumerate **remaining** compatibility work so Imp-12 can finish before Imp-13  

---

## 1. Wave A baseline (do not re-deliver)

| Delivered | Paths | Owner service |
|---|---|---|
| Edge create/delete user | `/functions[/v1]/create-user`, `delete-user` | Imp-03/11 users |
| RPC cascade | `/rpc` + `/rest/v1/rpc/delete_chantier_cascade` | Imp-04 chantiers |
| Profiles table | `GET/PATCH /tables/profiles` (+ id) | Imp-03/11 |
| Mount | `modules/compat/` + `mountCompat` | Imp-12 |

Wave A DRs locked: `001=A, 002=C, 003=C, 004=B`.

---

## 2. Remaining compatibility surface (after Wave A)

| Area | Remaining? | Classification summary |
|---|---|---|
| Table `chantiers` | Yes | READY |
| Table `affectations_chantiers` | Yes | READY (+ optional upsert DR) |
| Table `zones_equipe` | Yes | READY |
| Table `zones_chantiers` | Yes | READY |
| Table `zones_ouvriers` | Yes | READY |
| Table `periodes_travail` | Yes | READY |
| Table `declarations_heures` GET | Yes | READY |
| Table `declarations_heures` UPDATE (statut) | Yes | **BLOCKED** (Wave A DR-003=C) |
| Dual mount `/rest/v1/{table}` beside `/tables/{table}` | Yes | **BLOCKED** (needs Wave B DR) |
| Auth / GoTrue / session shape | Yes | **BLOCKED** (Wave A DR-004=B) |
| Realtime Supabase protocol bridge | Yes | **OUT OF SCOPE** (Imp-09) / DEFERRED cutover |
| Export payroll table | No separate table | **OUT OF SCOPE** — use Imp-08 `/api/export` |
| Inactive week auto-approve RPC | No | **OUT OF SCOPE** |
| Super Admin | No | **OUT OF SCOPE** |
| Imp-10 jobs / Imp-11 admin business | No | **NOT IMP-12** |
| Imp-13 readiness / ETL | No | **NOT IMP-12** |

---

## 3. Item catalogue (detail)

### WB-T-C — `chantiers` table adapter

| Field | Content |
|---|---|
| Purpose | FE Flow B worksite CRUD via table client |
| Current | Unified `GET/POST/PATCH/DELETE /api/chantiers`; DELETE row via cascade RPC (Wave A) |
| Missing | `GET/POST/PATCH /tables/chantiers` (+ optional `/rest/v1/chantiers`) |
| Existing owner | Imp-04 |
| Reused service | `chantiers` list/create/update (delete → existing RPC adapter) |
| Business ownership | Imp-04 |
| Write path | Single: Imp-04 service |
| New logic? | No — map only |
| Risk | Query filter subset vs PostgREST |
| Dependencies | DR for `/rest/v1` dual mount |
| Regression | Imp-04 suite |
| Evidence | FE_COMPATIBILITY_ADAPTERS · IMP12_FE_CONTRACT_MATRIX T-C-* · FLOW B |
| **Class** | **READY** |

### WB-T-A — `affectations_chantiers`

| Field | Content |
|---|---|
| Purpose | Flow B/C assignments |
| Current | `/api/affectations` GET/POST/PATCH soft-remove |
| Missing | `/tables/affectations_chantiers` verbs |
| Owner / reuse | Imp-05 assign / softRemove |
| Write path | Imp-05 only |
| New logic? | Upsert-on-conflict may need map DR if FE uses upsert |
| Risk | Soft-remove path naming |
| Evidence | Matrix T-A-* · routes `affectations` |
| **Class** | **READY** (upsert nuance → open DR in decision log) |

### WB-T-Z1 — `zones_equipe`

| Field | Content |
|---|---|
| Purpose | Flow C zone CRUD |
| Current | `/api/zones` CRUD |
| Missing | `/tables/zones_equipe` |
| Owner | Imp-05 |
| **Class** | **READY** |

### WB-T-Z2 — `zones_chantiers`

| Field | Content |
|---|---|
| Purpose | Link zone↔chantier |
| Current | `POST/DELETE /api/zones/:id/chantiers/:chantierId` |
| Missing | table insert/delete adapters composing ids from row |
| Owner | Imp-05 |
| **Class** | **READY** |

### WB-T-Z3 — `zones_ouvriers`

| Field | Content |
|---|---|
| Purpose | Zone worker membership |
| Current | `/api/zones/:id/ouvriers` POST/PATCH/DELETE |
| Missing | table adapters |
| Owner | Imp-05 |
| **Class** | **READY** |

### WB-T-P — `periodes_travail`

| Field | Content |
|---|---|
| Purpose | Flow D time capture |
| Current | `/api/timesheet/periods` CRUD |
| Missing | `/tables/periodes_travail` allow-list verbs |
| Owner | Imp-06 |
| Write path | Imp-06 (DeclarationSync inside TX) — adapter must not bypass |
| New logic? | **Forbidden** |
| Risk | Filter grammar; date range queries |
| Evidence | Matrix T-T-01 · `02_SINGLE_WRITE_PATH` |
| **Class** | **READY** |

### WB-T-D-R — `declarations_heures` SELECT

| Field | Content |
|---|---|
| Purpose | Read declarations for UI |
| Current | `GET /api/timesheet/declarations` |
| Missing | `GET /tables/declarations_heures` |
| Owner | Imp-06 read |
| **Class** | **READY** |

### WB-T-D-W — `declarations_heures` UPDATE (statut)

| Field | Content |
|---|---|
| Purpose | FE patches `statut` for review/cancel |
| Current | Imp-07 decide/approve/reject/return/cancel (not row PATCH) |
| Missing | Verb map table UPDATE → Imp-07 commands |
| Owner | Imp-07 business |
| New logic? | Mapping only — must not invent transitions |
| Risk | High if mapped wrong (second write path smell) |
| Dependencies | **Reopen or replace Wave A DR-IMP12-003=C** |
| Evidence | Matrix T-T-02 · Wave A decision |
| **Class** | **BLOCKED** |

### WB-MOUNT — Dual `/tables` vs `/rest/v1`

| Field | Content |
|---|---|
| Purpose | Live FE supabase-js uses `/rest/v1/{table}`; design SoT also names `/tables/{table}` |
| Current | Wave A: `/tables` for profiles only; RPC already dual `/rest/v1/rpc` |
| Missing | Policy for table dual mounts |
| Owner | Imp-12 mount layer |
| Evidence | FE_COMPATIBILITY_ADAPTERS · IMP12_FE_CONTRACT_MATRIX note |
| **Class** | **BLOCKED** (needs Wave B DR — not answered here) |

### WB-AUTH — Auth / session compatibility

| Field | Content |
|---|---|
| Purpose | Frozen FE `signInWithPassword` / session / refresh shapes |
| Current | Imp-02 `/api/auth/login|refresh|logout|me` |
| Missing | GoTrue-shaped or openapi `/auth/session` adapter |
| Owner | Imp-02 business; Imp-12 thin adapter only |
| Wave A | **DR-IMP12-004=B** — no auth adapter |
| Risk | Entire FE cutover blocked without adapter **or** FE config change (FE frozen → adapter preferred) |
| **Class** | **BLOCKED** (needs Human reopen / Wave B DR) |

### WB-RT — Realtime protocol bridge

| Field | Content |
|---|---|
| Purpose | FE `postgres_changes` channels |
| Current | Imp-09 `GET /events` SSE |
| Missing | Supabase Realtime wire protocol |
| Owner | **Imp-09** transport |
| **Class** | **OUT OF SCOPE** for Imp-12 · mark **NOT IMP-12** · cutover DEFERRED |

### WB-EXPORT — Export

| Field | Content |
|---|---|
| Purpose | Flow F |
| Current | Imp-08 `/api/export` |
| Missing | No CVL export **table** adapter evidenced as required if FE uses export REST / periods reads |
| **Class** | **OUT OF SCOPE** (Imp-08 owns export) |

---

## 4. NOT IMP-12 (explicit)

| Item | Owner |
|---|---|
| SSE semantics / catalog / scope | Imp-09 |
| Admin PATCH business / phone DDL / demotion | Imp-11 |
| Job runner / redispatch | Imp-10 |
| Production readiness / ETL cutover | Imp-13 / Phase 11 |
| Timesheet sync / review transitions (business) | Imp-06 / Imp-07 |
| FE source edits | Frozen `chantier1/` |

---

## 5. Feasibility (coding later)

Wave B **table allow-list adapters** look **feasible** after Human answers open Wave B DRs: business services already exist; Imp-12 pattern proven in Wave A.

**Auth adapter** and **declarations UPDATE map** are **gated** — without Human DR change, Imp-12 cannot claim full frozen-FE parity.

Realtime bridge is **not** Imp-12.

---

```
Phase: Imp-12 Wave B INVESTIGATION only.
STOP — no coding, no design review in this step.
```
