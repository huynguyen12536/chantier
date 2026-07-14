# Phase 08 — Migration Strategy

**Status:** ⬜ Todo · Blocked on Phase 5–7.

## Goal
Playbook chuyển Legacy A+B → Unified BE/DB (dual-run, freeze, disable Supabase writes, rollback).

## Inputs
Unified schema; Backend ADR; Merge Spec; Legacy dumps.

## Outputs / Deliverables
Migration/cutover-oriented strategy runbook (schema apply, trigger/Edge deprecate order).

## Acceptance Criteria
Safe sequencing for **two** legacies; RTO/RPO; no 1:1 blind copy.

## Exit Criteria
Playbook approved.

## Required Evidence
Runbook + risk sign-off.

## Dependencies
Phase 5–7.

## Risks
Split-brain during dual-run; order errors.

## Before Start
- [ ] Phase 7 ADR Done
- [ ] Data implications understood for Phase 11

## Rollback
Docs / dual-run abort paths.

## Decision Points
Big-bang vs phased cutover per domain.
