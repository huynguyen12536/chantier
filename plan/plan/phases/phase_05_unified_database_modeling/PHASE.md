# Phase 05 — Unified Database Modeling

**Status:** ⬜ Todo · Blocked on Phase 3–4.

## Goal
Thiết kế PostgreSQL **unified** (DDL plan, ER, merge dictionary) — đích persistence; không phải copy schema A hoặc B nguyên xi.

## Inputs
Merge Spec schema maps; Unified Domain; Legacy DDL/dumps A/B.

## Outputs / Deliverables
Target ER; DDL plan; table/column rename map; constraint/index strategy; tenancy model.

## Acceptance Criteria
Mọi mapped table có target hoặc Drop; identity strategy for merged users; FK strategy across merged entities.

## Exit Criteria
Schema design approved; apply-order + rollback notes for later phases.

## Required Evidence
DDL plan + mapping IDs.

## Dependencies
Phase 3–4.

## Risks
PK collisions; lossy merges; premature assuming single-tenant copy of A.

## Before Start
- [ ] Phase 4 Done
- [ ] Merge Spec schema section frozen

## Rollback
Docs-only until migrations applied (Phase 8+/11).

## Decision Points
Tenancy; soft-delete; which CHECK wins on conflicts.
