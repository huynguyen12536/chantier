# Phase 13 — Deployment / Cutover Strategy

**Status:** ⬜ Todo · Blocked on Phase 8 + 12.

## Goal
Deploy Unified FE/BE/DB; sequence disable Supabase A/B writes; rollback.

## Inputs
Migration Strategy; Testing Strategy; ops constraints.

## Outputs / Deliverables
Deployment + cutover runbooks.

## Acceptance Criteria
Dual-legacy cutover sequenced; Edge/Auth deprecate; freeze comms.

## Exit Criteria
Runbooks approved.

## Required Evidence
Runbooks.

## Dependencies
Phase 8, 12.

## Risks
Split-brain A/B.

## Before Start
- [ ] Phase 8 + 12 approved

## Rollback
FE flags; re-enable legacy writes; DNS revert.

## Decision Points
Big-bang vs phased domain cutover.
