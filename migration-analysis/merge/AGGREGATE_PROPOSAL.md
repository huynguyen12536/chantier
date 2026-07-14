# Aggregate Proposal

Candidates are architecture proposals only; no entities or persistence code are generated.

| Aggregate candidate | Root | Invariants to preserve | Related contexts |
|---|---|---|---|
| Workforce Member | Workforce Member (`profiles` candidate) | CVL role set; lifecycle authorization; zone-chef deletion guard outcome | Identity, Topology |
| Worksite | Worksite (`chantiers`) | unique code; assignment relation; controlled retirement/cascade behavior | Topology |
| Supervision Zone | Zone (`zones_equipe`) | owner/supervisor relation; worksite/member links | Topology |
| Daily Time Record | Daily Declaration (`declarations_heures`) | unique user/worksite/date; status and period synchronization | Time Recording, Review |
| Work Period | Work Period (`periodes_travail`) | multiple periods/day allowed; active/status consistency; resubmission behavior | Time Recording, Review |

The Daily Time Record and Work Period must be transactionally coordinated or event-synchronized so that CVL rules 5–9 and 15 retain observable parity. Future tenant/origin metadata is optional extension data, not a CVL invariant.
