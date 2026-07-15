# IMP12_WAVE_B_CAPABILITY_MATRIX.md

**Date:** 2026-07-15  
**Mode:** Investigation — no code  
**Rule:** Wave A rows omitted (already delivered).

---

## Legend

| Class | Meaning |
|---|---|
| READY | Existing service + clear adapter map; coding feasible after auth |
| BLOCKED | Needs Human DR / reopen before coding |
| OUT OF SCOPE | Not Imp-12 responsibility |
| DEFERRED | Later cutover / product — not Wave B default |

---

## Matrix

| ID | Capability | Adapter shape (candidate) | Unified target | Service reuse | Auth / RBAC | Write path | Class |
|---|---|---|---|---|---|---|---|
| WB-T-C | chantiers CRUD (no row DELETE) | `/tables/chantiers` | `/api/chantiers` | Imp-04 | Imp-04 roles | Imp-04 | **READY** |
| WB-T-A | affectations | `/tables/affectations_chantiers` | `/api/affectations` | Imp-05 | Imp-05 | Imp-05 | **READY** |
| WB-T-A-U | affectations upsert mimic | same + conflict | Imp-05 POST | Imp-05 | Imp-05 | Imp-05 | **BLOCKED** (optional DR) |
| WB-T-Z1 | zones_equipe | `/tables/zones_equipe` | `/api/zones` | Imp-05 | Imp-05 | Imp-05 | **READY** |
| WB-T-Z2 | zones_chantiers | `/tables/zones_chantiers` | zone link APIs | Imp-05 | Imp-05 | Imp-05 | **READY** |
| WB-T-Z3 | zones_ouvriers | `/tables/zones_ouvriers` | zone ouvrier APIs | Imp-05 | Imp-05 | Imp-05 | **READY** |
| WB-T-P | periodes_travail | `/tables/periodes_travail` | `/api/timesheet/periods` | Imp-06 | Imp-06 | Imp-06 TX | **READY** |
| WB-T-D-R | declarations SELECT | `/tables/declarations_heures` | `GET …/declarations` | Imp-06 | Imp-06 | read-only | **READY** |
| WB-T-D-W | declarations UPDATE statut | PATCH table → decide APIs | Imp-07 validate routes | Imp-07 | Imp-07 | Imp-07 only | **BLOCKED** |
| WB-MOUNT | `/rest/v1/{table}` dual | mount alias | same services | Imp-12 mount | same | same | **BLOCKED** |
| WB-AUTH | Auth session / GoTrue shape | `/auth/v1/…` or `/auth/session` | `/api/auth/*` | Imp-02 | Imp-02 | Imp-02 | **BLOCKED** |
| WB-RT | Realtime protocol | Supabase channel bridge | Imp-09 SSE | Imp-09 | Imp-09 | n/a | **OUT OF SCOPE** |
| WB-EXP | Export table | — | `/api/export` | Imp-08 | Imp-08 | Imp-08 | **OUT OF SCOPE** |
| WB-RPC2 | Auto-approve week RPC | — | — | — | — | — | **OUT OF SCOPE** |
| WB-SA | Super Admin | — | — | — | — | — | **OUT OF SCOPE** |

---

## Ownership / violation check

| Adapter | Would violate ownership if… | Avoid by |
|---|---|---|
| periods | Implementing sync in adapter | Call Imp-06 service only |
| declarations UPDATE | Updating `statut` via raw SQL/repo | Call Imp-07 approve/reject/… only |
| zones/affectations | Re-implementing demotion | No — Imp-11 owns role; Imp-05 owns assignment |
| auth | Re-issuing JWT rules in adapter | Call Imp-02 login/refresh only |

---

## Wave A exclusion (already done)

E-01, E-02, R-01, T-P-01, T-P-02 — **not in Wave B scope**.
