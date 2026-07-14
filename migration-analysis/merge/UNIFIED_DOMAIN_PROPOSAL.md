# Unified Domain Proposal

## Status

Proposed Unified Platform domain; **not Final Business Truth until Phase 4 confirmation**. The proposal preserves CVL concepts and leaves PLD additions unmodeled.

## Domain modules

| Module | Responsibility | CVL provenance |
|---|---|---|
| Identity & Workforce | Authenticated identity, workforce member, CVL roles, lifecycle | `auth.users`, `profiles`; Flows A/C |
| Worksite Topology | Worksites, assignments, zones, supervisory scope | `chantiers`, `affectations_*`, `zones_*`; Flows B/C |
| Time Recording | Period capture and daily declaration state | `periodes_travail`, `declarations_heures`; Flows D/E/G |
| Time Calculation | Duration, daily totals, cadre/fallback calculation | view/functions; SUMMARY §5 rule 10 |
| Review & Approval | Validate, reject, cancel, auto-approve | triggers; Flows D/E |
| Payroll Export | Validated-time reporting/export | Flow F |
| Platform Foundation (deferred) | tenant/company registry, product origin, Super Admin | Flow H greenfield only |

## Core invariants proposed for preservation

The Unified Platform must enforce CVL’s uniqueness, state propagation, assignment/zone visibility, validation, and export rules as listed in `SHARED_BUSINESS_RULES.md`. These are behavior obligations, independent of the future technical mechanism.

## Deliberate non-decisions

- No tenancy model is selected.
- No company or Super Admin entity is asserted as present in CVL.
- No env/ref is treated as production or as PLD.
- No drift winner (hard delete versus soft-cancel; fixed 7h versus cadre) is selected; it requires product confirmation.
