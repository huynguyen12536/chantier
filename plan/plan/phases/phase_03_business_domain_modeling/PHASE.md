# ⚠️ SUPERSEDED — Do not execute as current Phase 3

**Current Phase 3:** `../phase_03_merge_specification/`  
See `SUPERSEDED.md` in this folder. Historical content retained below for audit.

---

# Phase 03 — Business Domain Modeling (HISTORICAL — migration 1:1)

> Align with **old** Master Plan Phase 3.  
> **Status: Superseded — NOT started / NOT current.**  
> **Phase 2 status (historical):** Technical Investigation Complete · Waiting External Confirmation.

## Objective

Mô hình domain độc lập Supabase (bounded contexts + use-cases) cho Company BTP timesheet — **không** implement API / Entity code / migration data.

## Must not assume

Production Database đã được xác minh. Domain parity chỉ được assert sau Phase 2 Gate (`NEXT_ACTION_MATRIX` Scenario A/B/C).

## Current Gate

| Prerequisite | Required |
|---|---|
| Phase 0 SoT documents | ✅ |
| Phase 1 Architecture Scope Confirmed | ✅ |
| Phase 2 Technical Investigation Complete | ✅ |
| Phase 2 Waiting External Confirmation resolved | ❌ blocking (historical) |
| Database SoT == confirmed Runtime project | ❌ blocking (historical) |
| Explicit human “start Phase 3” | ❌ blocking |

Full checklist: superseded — use `phase_03_merge_specification/PHASE.md`.

## Inputs (when Gate opens)

**Confirmed** post-Gate SoT only:

- `business-flows.md`, `entity-relationship.md`, `SUMMARY.md` §5, `tables-used-by-frontend.md`
- `database-schema.md` / `functions/` / `triggers/` / `rls-analysis.md` (post-Gate)
- Closed `SOURCE_OF_TRUTH_DECISION.md`; unblocked C05 in `CONFIDENCE_MATRIX.md`

**Candidates only (pre-Gate):** 65 migrations; hzppst Verified Dump — not production truth.

## Outputs / Deliverables

| Deliverable | Description |
|---|---|
| Domain glossary | Terms ↔ confirmed schema |
| Bounded contexts | Users, Chantiers, Affectations, Zones, Periodes, Declarations, Export |
| Use-case list | Flows A–G; Flow H greenfield unless Decision Log |
| State machines | From confirmed CHECKs + diagrams |
| Rule ownership | SUMMARY §5 → module/use-case |
| Divergence register | Repo-only vs live Keep/Drop/Later |

## Tasks (not executed)

| ID | Title | Type |
|---|---|---|
| P3-T01 | Model identity + roles | Design |
| P3-T02 | Model sites + assignments + zones | Design |
| P3-T03 | Model timesheet periods ↔ declarations sync | Design |
| P3-T04 | Model validation / cancel / auto-approve / export | Design |
| P3-T05 | Multi-company scope decision | Documentation |

## Entry Criteria

- [ ] Phase 2 Gate closed + human Phase 2 Done  
- [ ] Runtime SoT == Database SoT  
- [ ] Human starts Phase 3  

## Exit Criteria

- [ ] All P3 tasks Done  
- [ ] Every SUMMARY §5 rule has owner  
- [ ] State diagrams signed-off vs **confirmed** SoT  
- [ ] Divergences documented  
- [ ] No Backend implementation  

## Required Evidence

Glossary + use-case docs under `phases/phase_03_*/` (or agreed path); Decision Log P3-T05; sign-off note.

## Rollback Strategy

Docs-only — discard drafts; zero runtime impact.

## Decision Points

- Sync: hard DELETE vs soft-cancel (from Database SoT)  
- Hours: 7h vs cadre  
- Week RPC Port/Drop  
- Flow H open/closed  

## Dependencies

Hard: Phase 1 Done; Phase 2 Gate Done. Soft: none.

## Out of Scope

API/Entity/data migration; treating hzppst as production without Scenario B.
