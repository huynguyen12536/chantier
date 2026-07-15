# PHASE13_IMPLEMENTATION_SEQUENCE.md

**Date:** 2026-07-15  
**Mode:** Design  
**Each WP independently testable after coding authorization**

---

## WP0 — Local URL baseline

| Deliver | Test |
|---|---|
| Remove cloud hardcode; `EXPO_PUBLIC_API_URL` | FE boots; network tab hits local host |
| Confirm Compose api+db | `GET /health` (or Imp-01 ready) |

---

## WP1 — Seed

| Deliver | Test |
|---|---|
| `seed:local` admin/chef/ouvrier + chantier | SQL rows exist; login credentials documented |

---

## WP2 — Auth cutover

| Deliver | Test |
|---|---|
| AuthContext → `/auth/v1` | Login, refresh, logout, profile load |
| Token on Edge fetch | create-user with Bearer works |

Regression: Imp-02 unit/suite still green.

---

## WP3 — Edge + RPC local

| Deliver | Test |
|---|---|
| FE functions URL = API_URL | create/delete user against local |
| RPC cascade | delete chantier via `/rest/v1/rpc` |

---

## WP4 — Thin table client

| Deliver | Test |
|---|---|
| `apiClient.from` allow-list filters | periodes CRUD; chantiers list |
| Point services/periods + timesheet basic paths | Insert period → 201 |

---

## WP5 — Mappers + composers

| Deliver | Test |
|---|---|
| Hour alias mapper | management create chantier with heure_debut |
| Worksites embed composer | AuthContext assignedWorksites |
| Zone GET composer / FE N+1 | team-management loads zones |
| Affectations POST replaces upsert | management save assignments |

---

## WP6 — Declarations → Imp-07

| Deliver | Test |
|---|---|
| Compat PATCH mapper **or** FE Imp-07 calls | validation approve/reject/cancel |
| No raw statut SQL | grep compat for UPDATE declarations absent |

---

## WP7 — SSE

| Deliver | Test |
|---|---|
| FE SSE helper wired in 3 screens | Event triggers reload; Imp-09 tests remain green |

Fallback: keep poll if SSE flake (**OPTIONAL**).

---

## WP8 — Closure readiness

| Deliver | Test |
|---|---|
| Runbook README section | Fresh clone → run path |
| Compat + full `npm test` | All PASS |
| Smoke script checklist | Flows A–G subset signed |

---

## Parallelism

WP0–WP1 backend; WP2 FE auth can follow WP0.  
WP4–WP5 after WP2.  
WP6–WP7 parallel after WP4.  
WP8 last.

---

## Stop after Human seal

Do not start WP coding until DR letters sealed and implementation authorized.
