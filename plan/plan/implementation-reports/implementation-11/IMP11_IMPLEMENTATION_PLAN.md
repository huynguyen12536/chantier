# IMP11_IMPLEMENTATION_PLAN — Administration (post-investigation)

**Date:** 2026-07-15  
**Status:** PLAN ONLY — do not code until Human answers DRs + authorizes Imp-11  
**Frozen modules:** Imp-05, Imp-06, Imp-07, Imp-08, Imp-09

---

## 1. Goal (after gate)

Close CVL Administration gaps that are **not** already delivered by Imp-03/04/05:

1. User **update** + **role promote/demote** with server-side demotion guards.  
2. Optional additive **`phone`** on profiles (if DR-IMP11-002 = Yes).  
3. Permission-scoped REST consistent with SUMMARY #2–3 / Flow A–C.  
4. Tests + reports; **no** Super Admin; **no** FE edits; **no** Imp-12 Edge aliases unless DR-IMP11-001 awards them to Imp-11.

---

## 2. Prerequisites

| Prerequisite | Status |
|---|---|
| Imp-02 Auth | Done |
| Imp-03 Users create/delete/list | Done |
| Imp-04 Chantiers + cascade | Done (consume; do not rewrite) |
| Imp-05 Affectations + Zones | Done (consume; do not rewrite) |
| Imp-09 Realtime | Closed — not a dependency |
| Human DRs Imp-11 | **Open** — see `IMP11_DECISION_REQUESTS.md` |

---

## 3. Proposed work packages (after DRs)

### WP-A — User PATCH / role lifecycle (must)

- Add `PATCH /api/users/:id` (or equivalent REST — same API family as Imp-03).  
- Fields evidenced: `nom`, `prenom`, `email`, `phone` (if column), `role`.  
- Matricule: FE treats immutable — reject or ignore changes.  
- AuthZ:  
  - admin: update others (preserve RLS spirit admin update).  
  - administratif: **create-only** per Edge; do **not** invent administratif UPDATE unless DR says so (default: align with RLS admin-only for other profiles).  
  - self-update: out of Imp-11 if not evidenced on management (profile self via Imp-12/tables).  
- Role change guards:  
  - block demoting `chef_equipe` if active `affectations.chef_equipe_id` OR owns `zones_equipe`.  
  - block changing role of another `admin` (FE lock).  
  - preserve SUMMARY self-delete already on DELETE.

### WP-B — Phone column (conditional on DR-IMP11-002)

- Additive migration only (`phone text default ''`).  
- Wire create + patch.  
- No DROP/rename.

### WP-C — Promote side-effects (minimal)

- Prefer: on successful promote to `chef_equipe`, document whether FE continues to set `chef_equipe_id` (CVL) or server syncs.  
- **Default plan (no invent):** do **not** auto-rewrite all affectations; keep FE-style assignment `chef_equipe_id` via Imp-05 POST unless Human requires server sync.

### WP-D — Observability / audit (conditional on DR-IMP11-003)

- Option A: structured logger only (zero schema).  
- Option B: reuse pattern from Imp-07 audit — needs explicit Yes (may invent if no CVL table).

### WP-E — Tests

- create (regression Imp-03)  
- patch fields  
- promote ouvrier→chef  
- demote blocked by affectation chef  
- demote blocked by zone owner  
- admin role lock  
- delete still ZONE_RESTRICT / SELF_DELETE  
- regression Imp-01→Imp-09 PASS  
- no Imp-05 business rewrite tests expected beyond consumption

### WP-F — Explicitly out of this Imp-11 plan

| Item | Owner |
|---|---|
| Edge `/functions/*` aliases | Imp-12 (unless DR awards Imp-11) |
| `/rpc/delete_chantier_cascade` alias | Imp-12 |
| `/tables/profiles` | Imp-12 |
| Re-implement zones/chantiers | Forbidden |
| Flow H Super Admin | Decision Log Deferred |
| FE edits under `chantier1/` | Forbidden |

---

## 4. Suggested API surface (illustrative — not committed)

| Method | Path | Roles | Notes |
|---|---|---|---|
| PATCH | `/api/users/:id` | admin (others); TBD self | Demotion guards |
| (existing) | GET/POST/DELETE users | unchanged | Imp-03 |

No `/api/admin` prefix required by CVL evidence.

---

## 5. Definition of Done (future implementation)

- [ ] DRs answered in Decision Log  
- [ ] Gaps G-01/G-02 closed (and G-03 if awarded)  
- [ ] Imp-03/04/05/06/07/08/09 untouched in business logic  
- [ ] Tests + Imp-11 reports  
- [ ] Commit + push + STOP for review  

---

## 6. Investigation STOP

This file is **not** authorization to implement. Await Human review of Imp-11 investigation pack + DR answers.
