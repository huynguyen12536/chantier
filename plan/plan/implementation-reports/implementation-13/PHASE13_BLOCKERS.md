# PHASE13_BLOCKERS.md

**Date:** 2026-07-15  
**Mode:** Investigation  
**Question:** What prevents a completely local runnable product today?

---

## Legend

| Class | Meaning |
|---|---|
| **READY** | Can proceed with existing Imp-01…12 surfaces |
| **BLOCKED** | Needs Human DR / Design / new authorization before coding |
| **OUT OF SCOPE** | Not required for CVL Phase 13 goal (or deferred product) |

---

## Blocker register

| ID | Item | Class | Why |
|---|---|---|---|
| P13-B01 | FE freeze vs cutover edits | **BLOCKED** | Hardcoded cloud URL + supabase-js wiring; URL-only cutover insufficient; thaw policy needs Human DR |
| P13-B02 | supabase-js ↔ `/auth/v1` fidelity | **BLOCKED** | Thin auth exists; `getSession` / `onAuthStateChange` / auto-refresh path unproven without GoTrue parity or FE auth rewrite |
| P13-B03 | PostgREST query / embed fidelity | **BLOCKED** | Imp-12 allow-list ≠ FE filters (`eq`, `or`, embeds, nested zone/affectation selects) |
| P13-B04 | Declarations UPDATE (Flow E) | **BLOCKED** | Imp-12 B-003=C omitted PATCH; validation UI updates `declarations_heures` |
| P13-B05 | Realtime protocol | **BLOCKED** | FE `.channel` postgres_changes vs Imp-09 SSE; Imp-12 B-006=B no bridge |
| P13-B06 | Affectations upsert / chef_equipe PATCH | **BLOCKED** | B-005=B + narrow PATCH=soft-remove; management uses upsert + chef sync updates |
| P13-B07 | zones_chantiers / zones_ouvriers SELECT | **BLOCKED** | Adapters write-focused; AuthContext / management read embeds |
| P13-B08 | Local seed pack | **BLOCKED** | No official Unified seed for demo logins |
| P13-B09 | Expo LAN / CORS DX | **READY** | Compose `CORS_ORIGIN`; verify at Design — not architecture-hard |
| P13-B10 | API + Postgres Compose | **READY** | `api-chantier/docker-compose.yml` exists |
| P13-B11 | Migrations 001–010 | **READY** | Present under `api-chantier/migrations` |
| P13-B12 | Edge create/delete + RPC cascade | **READY** | Imp-12 delivered |
| P13-B13 | Storage / MinIO | **OUT OF SCOPE** | No FE `.storage` |
| P13-B14 | Redis | **OUT OF SCOPE** | Imp-09/10 sealed without Redis |
| P13-B15 | Mail | **OUT OF SCOPE** | No mail flow evidenced |
| P13-B16 | Production ETL / cloud cutover | **OUT OF SCOPE** | Old Phase 13 cancelled; not this mission |
| P13-B17 | Super Admin / multi-company | **OUT OF SCOPE** | Decision Log deferred |
| P13-B18 | Export via Imp-08 instead of table SELECT | **OUT OF SCOPE** / optional | FE uses table SELECT today; Imp-08 available if Design chooses |

---

## Critical path (must unblock for MVP local product)

```
P13-B01 (FE policy)
    + P13-B02 (auth session)
    + P13-B03 (table query fidelity)  OR  FE client thaw that calls narrower APIs
    + P13-B04 (declarations validate) OR  FE thaw to Imp-07 REST
    + P13-B05 (realtime) OR  accept degrade/poll
    + P13-B08 (seed)
```

Backend containers alone are **not** enough.

---

## Imp-12 sealed limitations (cannot reopen silently)

| Imp-12 DR | Phase 13 impact |
|---|---|
| B-003=C | Blocks Flow E via table UPDATE unless **new** DR |
| B-005=B | Upsert invent still deferred |
| B-006=B | Realtime bridge still deferred |

Phase 13 may **request new DRs** (compat extensions or FE thaw) — not silent reopen of Imp-12 seals.

---

## Verdict

| Question | Answer |
|---|---|
| Completely local product possible in theory? | **YES** |
| Possible immediately with only env changes? | **NO** |
| Unresolved blockers? | **YES** — P13-B01…B08 |

**Phase 13 implementation must NOT begin** until Design Review seals strategy DRs.
