# Phase 09 — API Contract

**Status:** ⬜ Todo · Blocked on Phase 7.

## Goal
HTTP contracts Unified Frontend → Unified Backend (không assume Supabase client).

## Inputs
Unified use-cases; ADR; Legacy FE inventories A/B; Phase 6 services.

## Outputs / Deliverables
OpenAPI/contract pack; auth scheme; error model; versioning.

## Acceptance Criteria
Unified flows covered; payloads reconciled A/B differences; no `.from()`/`rpc` Supabase in contract.

## Exit Criteria
Contracts approved for implementation planning.

## Required Evidence
Contract files.

## Dependencies
Phase 7.

## Risks
PostgREST leak; incompatible FE A/B UX.

## Before Start
- [ ] Phase 7 Done
- [ ] Phase 4 use-cases available

## Rollback
Revise contracts; no runtime.

## Decision Points
REST vs RPC-style resources; pagination; idempotency.
