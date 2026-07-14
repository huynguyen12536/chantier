# Bounded Context Definition

| Context | Owns | Consumes | Publishes/coordinates | Exclusions |
|---|---|---|---|---|
| Identity & Workforce | member profile, CVL role, lifecycle status | authenticated identity | member provisioned/removed | company provisioning |
| Worksite Topology | worksite, assignment, zone membership, supervision links | member identity | scope changed | time status |
| Time Recording | work periods, daily declaration lifecycle | worksite eligibility, actor scope | period/declaration changed | payroll formatting |
| Review & Approval | validation/rejection/cancellation and auto-approval decision | periods, declarations, reviewer scope | decision applied | direct role management |
| Time Calculation | duration and daily totals | periods, worksite schedule | calculated totals | approval authority |
| Payroll Export | exports of validated time | approved periods/declarations | export generated | time mutation |
| Platform Foundation (deferred) | tenant/company, origin, Super Admin | none established | tenancy context | CVL parity claims |

Cross-context rules are governed through documented commands/events or transactions, preserving the current trigger effects. PLD is not assigned to a context until evidence is supplied.
