# ⚠️ SUPERSEDED — Do not execute as current Phase 5

Auth consolidation: Merge Spec → Logic → Backend Architecture → API Contract.  
See `SUPERSEDED.md`. Historical content below.

---

# Phase 05 — Authentication Migration (HISTORICAL — migration 1:1)

> Align with **old** Master Plan Phase 5.  
> **Status: Superseded.**  
> **Blocked on (historical):** Phase 4 ADR + Phase 2 Gate.

## Objective

Design (then later implement) JWT auth thay Supabase Auth, parity với profiles + Edge create/delete rules — **không** assume Production FK/hook behavior from repo-only migrations.

## Must not assume

- Production Database verified without Phase 2 Gate.  
- `zones_equipe.chef_equipe_id` is RESTRICT — **must read confirmed Database SoT** (hzppst Verified Dump showed CASCADE; repo has later RESTRICT migration).  
- Auth Hook exists — re-confirm on Database SoT (absent on hzppst dump).

## Inputs

| Input | Source |
|---|---|
| Auth flows | `auth-flow.md` |
| Edge create-user / delete-user | Edge source + auth-flow |
| Phase 4 ADR | Auth module contract |
| Confirmed Database SoT | Post-Gate schema notes |
| FE AuthContext | `frontend-overview.md` |

## Outputs / Deliverables

- Auth store + JWT claims design  
- create-user / delete-user port specs  
- seed-test-users decision  
- Mapping `auth.users` → local credentials  
- (Later task) Implement + FE login parity validation  

## Tasks (not executed)

P5-T01…T07 as Master Plan — Design before Implementation.

## Entry Criteria

- [ ] `PREREQUISITE_CHECKLISTS.md` Phase 5  
- [ ] Phase 4 ADR approved  
- [ ] Database SoT Confirmed  

## Exit Criteria

- [ ] Login/password parity design  
- [ ] Create/delete without Supabase Admin API (design/impl per task type)  
- [ ] No reliance on Auth Hook  
- [ ] Security review for auth tasks  

## Required Evidence

Auth API contract; Edge rule matrix; Decision Log seed-test-users; Security Engineer notes.

## Rollback Strategy

Design reversible; implementation behind flag; keep Supabase Auth until cutover.

## Decision Points

JWT role claim vs DB lookup; password policy; refresh; biometric remains local.

## Dependencies

Phase 4 hard; Phase 6 consumes claims/session shape.

## Out of Scope

Multi-company IdP; assuming Zone RESTRICT without SoT confirm.
