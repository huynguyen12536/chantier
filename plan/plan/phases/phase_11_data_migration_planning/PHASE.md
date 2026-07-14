# Phase 11 — Data Migration Planning

**Status:** ⬜ Todo · Blocked on Phase 3 data maps + Phase 5 + Phase 8.

## Goal
ETL/merge plan Legacy A+B → Unified DB (identities, FKs, reconcile, dry-run, rollback).

## Inputs
Merge Spec data section; Unified DDL; Migration Strategy.

## Outputs / Deliverables
Data migration plan; identity merge rules; reconcile queries design.

## Acceptance Criteria
Duplicate users handled; A-only/B-only data; 0-critical reconcile criteria defined.

## Exit Criteria
Plan approved (scripts later).

## Required Evidence
Plan + sample reconciliation design.

## Dependencies
Phase 3, 5, 8.

## Risks
Irreversible merges; orphans.

## Before Start
- [ ] Merge Spec data map frozen
- [ ] Unified schema approved

## Rollback
PITR / backup restore plans documented.

## Decision Points
Password migration; freeze windows.
