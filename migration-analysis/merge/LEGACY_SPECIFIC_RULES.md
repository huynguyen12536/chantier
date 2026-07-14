# CVL-Specific Nuances

| Nuance | Evidence | Preserve/Document | Treatment |
|---|---|---|---|
| `nb_deplacements` exists but sync upsert does not write it | `SUMMARY.md` §4; diff §8.1 | Document | Preserve observed behavior/data provenance; correction needs product decision. |
| Auto-approval does not set `validated_by` | `SUMMARY.md` §4 | Document | Do not invent a system approver. Future attribution policy requires approval. |
| Zone-ouvrier “Admin can insert” policy is `FOR SELECT` in dump | diff §9; `rls-analysis.md` §10 | Document, do not preserve defect automatically | Treat as security/regression decision; do not call it a valid permission rule. |
| Zone chef deletion is dump CASCADE vs repository RESTRICT | diff §6 | Document | Preserve neither as final without a decision; maintain lifecycle guard contract. |
| Dump sync deletes declaration when no active periods; repo intends soft-cancel | diff §8.1 | Document | Product chooses final state behavior; both are CVL evidence. |
| Dump view uses fixed 7h; repository has cadre-hours calculation | diff §3 | Document | Product chooses the calculation baseline. |
| Realtime subscription is in frontend, dump publication is empty | diff §10; FE inventory §194 | Document | Contract requires equivalent live-update behavior before cutover. |

These nuances are not PLD rules and must not be silently normalized during merge design.
