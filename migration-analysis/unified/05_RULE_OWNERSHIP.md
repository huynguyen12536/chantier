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
| Period-to-declaration synchronization | Time Recording write path | Transform; single owner | Merge matrix |
| Declaration-to-period reconciliation | Review & Approval write path | Transform; single owner | Merge matrix |
| Matching-shift auto-approval | Approval policy | Transform; condition pending drift decision | Merge matrix |
| Duration/cadre calculation | Calculation policy | Keep/transform; no 7h/cadre winner asserted | Merge matrix |
| Cascade worksite deletion | Worksite retirement transaction | Transform and audit | Merge matrix |
| Export permission and validated filter | Payroll Export | Port | Flow F |
| Commented week auto-approve RPC | No active owner | Deferred | Merge matrix |
