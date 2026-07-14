# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Unified glossary

| Term | Meaning | Evidence/status |
|---|---|---|
| Worksite (`chantier`) | Operational location where work is recorded. | CVL Flow B |
| Assignment (`affectation`) | Time-bounded user-to-worksite relationship. | CVL Flow B |
| Work period (`periode_travail`) | A recorded unit of work including time and allowances. | CVL Flow D |
| Hours declaration | Reviewable daily aggregation/synchronization view of periods. | CVL Flows D–E |
| Submission | State in which a declaration awaits review. | CVL Flow D |
| Validation | Authorized approval/rejection of a declaration. | CVL Flow E |
| Team zone | Scope that grants a worker visibility/assignment relationship. | CVL Flow C |
| Retire worksite | Auditable replacement for destructive cascade deletion. | Merge matrix: RPC transform |
| CVL | Current Verified Legacy; evidence, not target runtime truth. | Execution Manual |
| Pending Legacy Discovery | Future source whose rules are intentionally unknown. | Decision O3 |
| Unified Platform | One frozen FE contract, modular backend, and PostgreSQL target. | Execution Manual |
