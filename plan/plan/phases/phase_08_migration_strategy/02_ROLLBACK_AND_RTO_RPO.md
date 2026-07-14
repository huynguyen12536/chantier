# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Rollback, RTO, and RPO

| Topic | Design requirement |
|---|---|
| Rollback trigger | Reconciliation failure, unacceptable authorization/state error, or declared service objective breach. |
| Rollback action | Stop Unified writes, preserve correlation/audit evidence, restore CVL write authority under the pre-freeze procedure, investigate before retry. |
| RTO | To be set from an operationally tested restore/cutover rehearsal; no factual target is asserted. |
| RPO | To be set from an approved snapshot/delta and reconciliation design; no factual target is asserted. |
| Data safety | Backups, restore test, immutable cutover logs, and reversible release boundaries are prerequisites. |

The playbook does not claim zero loss or instant recovery without evidence.
