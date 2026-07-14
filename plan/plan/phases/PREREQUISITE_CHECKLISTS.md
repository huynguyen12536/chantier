# ⚠️ SUPERSEDED content below — Consolidation (2026-07-14)

Checklists for **migration 1:1** Phase 3 “Domain Modeling” / old P4–P14 are **historical**.

**Authoritative prerequisites:** each new `phase_XX_*/PHASE.md` under Consolidation roadmap + Master Plan `00_README_EXECUTION.md`.

**New Phase 3 = Merge Specification** — Gate: Legacy A + Legacy B identified (or Decision Log exception).  
**Không** còn: “Runtime Database Confirmed + Production SoT” làm hard gate duy nhất trước mọi design.

Global Track L (Phase 2 Waiting External Confirmation) vẫn hữu ích để **label** dump — xem `NEXT_ACTION_MATRIX.md`.

---

# Prerequisite Checklists — Phases 3–14 (HISTORICAL TEXT)

**Original purpose:** Gate “Before Start” cho roadmap migration 1:1.  
**Flow state at authoring:** Phase 2 = Technical Investigation Complete · Waiting External Confirmation.

Cross-ref (updated): Master Plan Consolidation · `phase_03_merge_specification/PHASE.md`

---

## Global (HISTORICAL — do not use as Consolidation Gate)

### Before any Design/Implementation phase beyond P2 (old)

- [ ] Runtime Database Confirmed (Scenario A/B/C)
- [ ] Database Source of Truth Confirmed (`SOURCE_OF_TRUTH_DECISION.md` closed)
- [ ] Phase 2 Gate closed + human approve Phase 2 Done
- [ ] Decision Log updated with Runtime = Dump project

### Consolidation Global (USE THIS)

- [ ] Product direction = Consolidation + Replatforming understood
- [ ] System A Legacy Analysis available (`migration-analysis/`)
- [ ] System B identified **or** Decision Log exception
- [ ] Human starts the phase named in status board (Merge Spec first)
- [ ] No Backend/API/Entity generated in analysis phases

---

## Phase 3 — Merge Specification (CURRENT)

See `phase_03_merge_specification/PHASE.md` — authoritative.

### Before Start (summary)

- [ ] Frontend A / Supabase A identity recorded
- [ ] Frontend B / Supabase B identity recorded **or** Decision Log
- [ ] Legacy A docs readable
- [ ] Legacy B docs/dump/repo available **or** exception
- [ ] Team understands Merge Spec = design SoT
- [ ] Human starts Phase 3

---

## Phase 3 — Business Domain Modeling (SUPERSEDED checklist)

### Before Start

- [ ] Runtime Database Confirmed
- [ ] Database Source of Truth Confirmed
- [ ] Diff Runtime DB vs repository reviewed (post-Gate SoT)
- [ ] Business Flows A–G available (`business-flows.md`)
- [ ] Business Rules SUMMARY §5 available
- [ ] Entity / ER docs available
- [ ] Tables used by FE inventory available
- [ ] Trigger behavior Confirmed **on Database SoT** (sync / cancel / auto-approve body)
- [ ] Functions / RPC inventory Confirmed **on Database SoT** (present vs repo-only)
- [ ] RLS / helpers inventory available (`rls-analysis.md` post-Gate)
- [ ] CHECK statuses for periods / declarations Confirmed
- [ ] Multi-company / Flow H = out of scope unless Decision Log opens
- [ ] Human explicitly starts Phase 3

### Required Evidence (Exit)

Historical — replaced by Merge Spec exit criteria.

---

> **Note:** Remaining sections for old Phases 4–14 in prior file revisions remain in git history.  
> Use new folders `phase_04_unified_domain_discovery` … `phase_14_production_rollout` for current gates.
