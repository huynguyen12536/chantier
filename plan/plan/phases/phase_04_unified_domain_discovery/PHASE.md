# Phase 04 — Unified Domain Discovery

**Status:** ⬜ Todo · Blocked on Phase 3 Merge Spec.

## Goal
Domain model thống nhất (bounded contexts, use-cases, state machines) từ Merge Spec — độc lập Supabase.

## Inputs
Merge Spec approved; Legacy flows A/B; SUMMARY rules (as Legacy inputs).

## Outputs / Deliverables
Unified glossary; contexts; use-case catalog; state machines; rule ownership on **unified** model.

## Acceptance Criteria
Mọi conflict rule từ Merge Spec có use-case owner hoặc Drop; no Super Admin invent without Decision Log.

## Exit Criteria
Domain pack signed-off; no Entity/API code.

## Required Evidence
Domain docs under `migration-analysis/unified/` (or agreed path).

## Dependencies
Phase 3 Done.

## Risks
Bias toward System A; dropping B-only UX.

## Before Start
- [ ] Merge Spec approved
- [ ] Human starts Phase 4

## Rollback
Docs-only.

## Decision Points
Greenfield capabilities beyond A∪B; Flow H-like features.
