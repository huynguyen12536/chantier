# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Rule ownership

| Rule / concern | Unified owner | Treatment | Evidence |
|---|---|---|---|
| Password floor, matricule default, create-user authorization | Identity & Access use case | Port with CVL outcome preserved | Flow A |
| Worksite code, assignments, soft end | Worksite & Assignment | Port/centralize | Flow B |
| Prevent unsafe supervisor demotion | Worksite & Assignment | Port | Flow C |
| Period-to-declaration synchronization | Time Recording write path | Transform; Soft Annulee (DR-IMP06-001); omit nb_deplacements write (DR-IMP06-003) | Merge matrix + DRs |
| Declaration-to-period reconciliation | Review & Approval write path | Transform; single owner | Merge matrix |
| Matching-shift auto-approval | Approval policy | Transform; **must set validated_by + validated_at** (DR-IMP06-003) | Merge matrix + DR |
| Duration/cadre calculation | Calculation policy | **CADRE with 7h fallback** (DR-IMP06-002) | DR-IMP06-002 |
| Cascade worksite deletion | Worksite retirement transaction | Transform and audit | Merge matrix |
| Export permission and validated filter | Payroll Export | Port | Flow F |
| Commented week auto-approve RPC | No active owner | Deferred | Merge matrix |
