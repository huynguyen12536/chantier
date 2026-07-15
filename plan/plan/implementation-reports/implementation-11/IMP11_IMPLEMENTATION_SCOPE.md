# IMP11_IMPLEMENTATION_SCOPE — Ownership boundaries

**Date:** 2026-07-15  
**Type:** Investigation / scope lock (no code)

Unified Administration = **UNION** of CVL Administration capabilities and Unified Imp-02/03(+support) already delivered. Imp-11 only closes Administration-owned remaining categories (REST / additive SQL / Admin business). It must **reuse** Imp-04/05 surfaces and **defer** FE adapters to Imp-12.

---

## 1. What Imp-11 owns (IN)

| Area | Detail | Matrix IDs |
|---|---|---|
| User update REST | `PATCH /api/users/:id` for profile fields | A-07 |
| Role promote / demote | Role change on PATCH + policies | A-08, C-01, C-02 |
| Admin role lock | Cannot re-role locked admins (FE evidence) | A-09 |
| Demotion guards (server) | Read affectations/zones; block unsafe demote | C-02, C-03, C-05 |
| Phone union | Additive column + create/PATCH wiring | ID-06, A-01 |
| Matricule UNIQUE (nonempty) | Additive unique index (UNION CVL) | ID-04 |
| Nom/prenom required on admin write | Service validation (CVL Edge) | ID-07 |
| Admin observability | Per DR-IMP11-003 (prefer logs) | O-02 |
| Tests + Imp-11 reports | Against Administration APIs only | — |

**Allowed DDL:** exactly **one new** additive migration file for phone (+ optional matricule unique). No rewrite of 001–009.

---

## 2. What previous phases already own (REUSE — Imp-11 FORBIDDEN rewrite)

| Phase | Owns | Imp-11 may |
|---|---|---|
| Imp-02 | Auth, profiles base, password_hash, actif, JWT, refresh | consume |
| Imp-03 | `GET/POST/DELETE /api/users`, create/delete guards | extend with PATCH only |
| Imp-04 | Chantiers CRUD, cascade delete | call/reuse only |
| Imp-05 | Affectations, zones ownership, soft-remove | **read** for demotion; no BC rewrite |
| Imp-06 | Timesheet | none |
| Imp-07 | Review + approval_audit | none (different BC) |
| Imp-08 | Export | none |
| Imp-09 | SSE realtime (CLOSED) | none |

---

## 3. What Imp-12 will own (DEFER)

| Item | Why |
|---|---|
| `POST /functions/create-user` | FE frozen Edge contract; REST create already exists (A-14) |
| `POST /functions/delete-user` | same (A-15) |
| `/rpc/delete_chantier_cascade` | REST DELETE exists (D-03) |
| `/tables/profiles` (and other table adapters) | fe_contract_matrix Imp-12 |
| FE code under `chantier1/` | FE Frozen |

Confirm with **DR-IMP11-001**.

---

## 4. Explicitly never Imp-11

| Forbidden | Reason |
|---|---|
| Affectations business redesign | Imp-05 |
| Zones business redesign | Imp-05 |
| Chantiers business redesign | Imp-04 |
| Timesheet / Review / Payroll / Export / Realtime / Notifications | Imp-06–09 |
| Super Admin / multi-company | Decision Log Deferred |
| DROP/rename/recreation of schema | UNION policy |

---

## 5. Merge category → owner mapping

| Category | Typical owner |
|---|---|
| Already merged | — (done) |
| Reuse existing implementation | Imp-04 / Imp-05 / Imp-02 / Imp-03 |
| Needs REST endpoint only | **Imp-11** |
| Needs additive SQL migration only | **Imp-11** (one file) |
| Needs Administration business implementation | **Imp-11** |
| Deferred | Imp-12 / Decision Log |

---

## 6. Coverage statement

| Assertion | Status |
|---|---|
| Every CVL Administration capability classified | Yes — matrix |
| Every Unified-native identity capability preserved | Yes — `actif`, password_hash, refresh kept |
| No previous phase redesigned | Scope lock above |
| DB changes additive only | Schema merge report |
| UNION not clone / not replace | Explicit in matrix + schema diagram |

**Coding still gated** on Decision Log answers — see `IMP11_DECISION_LOG_UPDATE.md`.
