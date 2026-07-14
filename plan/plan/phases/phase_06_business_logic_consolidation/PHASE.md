# Phase 06 — Business Logic Consolidation

**Status:** ⬜ Todo · Blocked on Phase 3–5.

## Goal
Hợp nhất Triggers / Functions / RPC / Edge / FE orchestration A+B → catalog **Port-to-Backend** / Keep-SQL / Drop với single write-path.

## Inputs
Merge Spec logic maps; Unified Domain; Unified DB model.

## Outputs / Deliverables
Consolidated inventory matrix; service ownership; conflict resolutions.

## Acceptance Criteria
No dual-write legacy patterns without owner; sync/validate/export/auth edge rules all decided.

## Exit Criteria
Signed Keep/Port/Drop for A∪B; ready for Backend ADR.

## Required Evidence
Inventory matrix + Decision Log.

## Dependencies
Phase 3–5.

## Risks
Trigger/function conflicts; silent Drop of B logic.

## Before Start
- [ ] Phase 5 schema targets available
- [ ] Merge Spec logic sections complete

## Rollback
Docs-only.

## Decision Points
Hours calculators source of truth; auto-approve audit; week RPC.
