# Phase 3 Merge Specification — Overview

## Decision and scope

**Decision O3:** continue with **Current Verified Legacy** (CVL); design the **Unified Platform** open for a future merge with **Pending Legacy Discovery** (PLD).

This is a documentation-only merge specification. It proposes mappings and extension points; it does not create backend code, change the frozen frontend, promote an environment to production, or establish final business truth.

## Required terminology

| Term | Meaning |
|---|---|
| Current Verified Legacy | The reverse-engineered workspace product documented in `migration-analysis/`. |
| Pending Legacy Discovery | A possible second legacy product for which no adequate repository, dump, or RE evidence is available. |
| Unified Platform | The proposed future platform that can preserve CVL behavior and accept a later merge decision. |

## Sources of truth by level

1. **CVL evidence:** `migration-analysis/SUMMARY.md`, flows, schema, dump comparison, and frontend inventory. It is a CVL source, **not Final Business Truth**.
2. **Frontend contract:** frozen frontend Supabase usage. Backend design must adapt to this contract until an explicitly approved frontend change.
3. **Phase 3 merge specification:** proposed Unified Platform mapping, pending architecture/business confirmation in Phase 4.
4. **Final Business Truth:** only a future product/architecture decision can establish it.

`afgveikzneaablcuzwdb` is the committed frontend runtime reference and `hzppsttpzzeuslnpcdkv` is a verified dump reference. They are candidates for environment/repository drift within CVL; neither proves a separate legacy product nor production identity.

## Open-for-merge principles

- Preserve every evidenced CVL rule until an approved merge decision changes it.
- Do not infer PLD objects, policies, data, or conflicts without evidence.
- Use stable capability and domain names, explicit source provenance, and optional tenancy/legacy-origin extension points.
- Prefer CVL names where required by the frozen frontend contract; separate internal capability names can evolve later.
- Treat Super Admin/company provisioning as deferred greenfield scope, not an existing CVL capability.
- Resolve conflicting evidence by recording provenance and an explicit decision; never rewrite historical RE records.

## Phase 3 completion boundary

The pack is complete when all CVL inventory classes are mapped, all 15 shared rules are traced, known drift is registered, and PLD gaps are explicitly deferred. It remains **PASS pending final Review agent confirmation and human/product sign-off**.

## Wave 2 product decisions affecting Merge Spec (Imp-06)

For Unified Platform Timesheet write-path, Decision Log winners supersede CVL dump/repo drift:

| Conflict | Winner | Decision |
|---|---|---|
| C-04 empty-day sync | Soft Annulee (no hard DELETE) | DR-IMP06-001 |
| C-03 hours calculation | CADRE; fallback 7h only if no cadre | DR-IMP06-002 |
| C-08 / C-09 field quirks | Preserve omit `nb_deplacements` on sync; fix auto-approve `validated_by`+`validated_at` | DR-IMP06-003 |

See `CONFLICT_MATRIX.md`, `triggers_mapping.md`, `functions_rpc_mapping.md`, `SHARED_BUSINESS_RULES.md`.
