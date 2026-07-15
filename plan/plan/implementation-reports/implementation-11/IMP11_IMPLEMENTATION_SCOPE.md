# IMP11_IMPLEMENTATION_SCOPE — IN / OUT / REUSE / DEFERRED

**Date:** 2026-07-15  
**Mode:** Investigation / ownership lock — no code  
**UNION:** Final Admin = CVL Admin ∪ Unified capabilities (Imp-02→Imp-09 surfaces)

---

## IN — Imp-11 Administration only

| Item | Category | Matrix |
|---|---|---|
| `PATCH /api/users/:id` (profile fields) | 3 | A-07 |
| Role promote / demote on PATCH | 5 | A-08, C-01, C-02 |
| Admin role lock | 5 | A-09 |
| Demotion guards (READ Imp-05 data) | 5 | C-02 |
| Additive `phone` + wiring | 4 | ID-06 |
| Additive nonempty matricule UNIQUE | 4 | ID-04 |
| Nom/prenom required on admin write | 5 | ID-07 |
| Matricule immutable on edit | 5 | FE contract |
| Admin structured logs (if DR-003 = A) | 5/6 | O-02 |
| Imp-11 tests + reports | — | — |

**DDL budget:** exactly **one** new additive migration file.

---

## OUT — Forbidden to Imp-11

| Item | Owner |
|---|---|
| Affectations business redesign / rewrite | Imp-05 |
| Zones business redesign / rewrite | Imp-05 |
| Chantiers business redesign / rewrite | Imp-04 |
| Timesheet | Imp-06 |
| Review / approval_audit BC | Imp-07 |
| Export / payroll | Imp-08 |
| Realtime / SSE | Imp-09 CLOSED |
| Notifications architecture | Imp-09 / later |
| FE implementation under `chantier1/` | Frozen |
| Super Admin / multi-company / Flow H | Decision Log Deferred |
| DROP / rename / rewrite past migrations | UNION policy |

---

## REUSE — Consume previous Imps (never duplicate)

| Imp | Surfaces Imp-11 consumes |
|---|---|
| Imp-02 | profiles base, `password_hash`, `actif`, JWT, refresh_tokens |
| Imp-03 | GET/POST/DELETE users (extend with PATCH only; do not rewrite create/delete) |
| Imp-04 | Chantiers APIs if admin UX adjacency needs them — no rewrite |
| Imp-05 | **READ** `affectations_chantiers`, `zones_equipe` for demotion/delete adjacency |

---

## DEFERRED — Other phase

| Item | Phase | Category |
|---|---|---|
| `POST /functions/create-user` | Imp-12 | 6 |
| `POST /functions/delete-user` | Imp-12 | 6 |
| `/rpc/delete_chantier_cascade` | Imp-12 | 6 |
| `/tables/profiles` (+ table adapters) | Imp-12 | 6 |
| Super Admin portal | Decision Log | 6 |

Confirm adapters via **DR-IMP11-001**.

---

## Ownership cheat-sheet

| Concern | Owner |
|---|---|
| Authentication / credentials | Imp-02 |
| Users create/delete/list | Imp-03 |
| Administration update/role/policies/phone UNION | **Imp-11** |
| Worksites | Imp-04 |
| Zones / affectations | Imp-05 |
| FE Edge/RPC aliases | Imp-12 |

---

## Coverage lock

| Assertion | Status |
|---|---|
| CVL Admin capabilities classified | Yes — matrix |
| Unified-native kept (`actif`, password, refresh) | Yes |
| No silent drop | Yes |
| Imp-04…09 untouched by Imp-11 plan | Yes |

Coding remains gated: `IMP11_DECISION_LOG.md`.
