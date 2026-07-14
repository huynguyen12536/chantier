# Phase 07 — Backend Architecture Design

**Status:** ⬜ Todo · Scaffold Partial only · Blocked on Phase 6.

## Goal
ADR Unified Backend Express modular + Postgres thay thế hoàn toàn Supabase runtime (Auth, AuthZ, services, storage/realtime strategies).

## Inputs
Phase 4–6; `api-chantier/` scaffold; API surface inventories Legacy A/B.

## Outputs / Deliverables
ADR; module layout; error model; migration runner; realtime/storage strategy; observability/rollback hooks (design).

## Acceptance Criteria
ADR approved; mọi Port item Phase 6 có module; Compose canonical; **scaffold ≠ Architecture Done**.

## Exit Criteria
ADR signed; Decision Log architecture rows.

## Required Evidence
ADR path.

## Dependencies
Phase 6 hard.

## Risks
Cloning PostgREST; skipping AuthZ; treating scaffold as Done.

## Before Start
- [ ] Phase 6 Done
- [ ] Merge Spec available for cross-check

## Rollback
Reject ADR; keep scaffold.

## Decision Points
Module boundaries; JWT; realtime replacement.
