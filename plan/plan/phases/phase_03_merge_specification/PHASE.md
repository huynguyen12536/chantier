# Phase 03 — Merge Specification

> **Master Plan (Consolidation + Replatforming).**  
> Đây là phase **quan trọng nhất** trước Unified Backend Design.  
> **Status:** ⬜ Todo — NOT started.

## Objective

Xây **Merge Specification**: ánh xạ đầy đủ Legacy A ↔ Legacy B → quyết định hợp nhất làm **Source of Truth** cho Unified Domain / DB / Backend.

## Goal

Không clone một Supabase. Hợp nhất hai hệ legacy thành một đặc tả duy nhất.

## Inputs

- Legacy Analysis A: `migration-analysis/` (Phase 0–2 workspace RE) — labeled **Legacy**
- Legacy Analysis B: **TBD** — repo/dump/docs (Gate)
- Product naming: official IDs for System A / System B
- Optional: dumps afgveikz / hzppst as *candidate* DB evidence (not auto Production SoT)

## Outputs / Deliverables

Directory (suggested): `migration-analysis/merge/`

| Artifact | Content |
|---|---|
| `00_MERGE_OVERVIEW.md` | Scope, A/B identity, principles |
| `schema_mapping.md` | Tables/columns/types/constraints A↔B↔Target |
| `business_rules_mapping.md` | Rules & conflicts |
| `triggers_mapping.md` | Triggers A/B → Transform/Drop |
| `functions_rpc_mapping.md` | Functions/RPC |
| `edge_functions_mapping.md` | Edge |
| `auth_mapping.md` | Auth flows / credentials |
| `permissions_mapping.md` | RLS / roles / policies |
| `storage_mapping.md` | Storage objects (or N/A) |
| `realtime_mapping.md` | Channels |
| `data_merge_mapping.md` | Row merge / A-only / B-only / duplicates |
| `conflict_register.md` | Open conflicts + decisions |

Mỗi hàng mapping: `Object` · `System` · `Equivalent` · `Decision` (`Unify`/`Transform`/`A-only`/`B-only`/`Drop`) · `Evidence` · `Owner`

## Acceptance Criteria

- [ ] System A and B identity recorded (or Decision Log: B deferred / B=same codebase)
- [ ] All inventory classes mapped
- [ ] Conflicts listed with decision or explicit “open blocker”
- [ ] Product / Architect sign-off
- [ ] No Backend/API/Entity code produced in this phase

## Exit Criteria

- [ ] Merge Spec pack complete + approved  
- [ ] Decision Log updated  
- [ ] Status board → Done  
- [ ] Downstream Phase 4 unblocked  

## Required Evidence

Merge Spec files + conflict register + sign-off note.

## Dependencies

- Soft: Phase 0–2 Legacy A available  
- Hard Gate: Legacy B inputs **or** explicit Decision Log exception  

## Risks

- Missing System B; mis-labeling afgveikz/hzppst as A/B products; unresolved rule conflicts  

## Prerequisite Checklist (Before Start)

- [ ] Product confirms what Frontend A / B and Supabase A / B are (paths, URLs, dumps)
- [ ] Legacy A docs readable
- [ ] Legacy B docs/dump/repo available **or** Decision Log exception
- [ ] Team understands Merge Spec = design SoT (not runtime SoT yet)
- [ ] Human starts Phase 3

## Rollback Strategy

Docs-only — discard draft merge files; Legacy Analysis untouched.

## Decision Points

- A/B identity of project refs  
- Conflict winners (A vs B vs new unified rule)  
- Defer System B?
