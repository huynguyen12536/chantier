# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Production rollout and hypercare pack — planning only

## Coverage and ownership
Define on-call roster, escalation path, release/data/security owners, support intake, incident commander, communications owner, and decision authority before cutover. Hypercare begins only after an executed Phase 13 cutover.

## KPIs and alerts
| Signal | Alert/gate |
|---|---|
| API availability, latency, error rate | degradation against approved SLO triggers incident triage |
| Authentication and authorization denials | anomaly/rate spike and privilege-denial review |
| Time/declaration state transitions | missing sync, stuck state, or unexpected status totals |
| Realtime/event delivery | disconnected clients, authorization rejects, lag/retry spike |
| Export | failed/unauthorized export and parity discrepancy |
| Data integrity | reconciliation drift, orphan relation, identity/manual-review backlog |
| Security/operations | secret access anomaly, audit-log gap, backup/restore signal |

Thresholds, SLOs, dashboards, and retention values are intentionally not invented; they must be agreed and tested in the implementation wave.

## Hypercare exit
Exit only after the agreed observation window, stable approved KPI/SLO evidence, no unresolved critical integrity/security/contract issue, reconciliations complete, support handoff accepted, CVL retirement/retention decision recorded, and post-cutover review completed.
