# Conflict Matrix

| ID | Compared evidence | Difference | Classification | Risk | Required decision |
|---|---|---|---|---|---|
| C-01 | `afgveikz` committed runtime vs `hzppst` verified dump | Runtime/dump identity unproven | Expected environment/ref drift | Regression if wrong source is ported | Confirm active traffic/production source |
| C-02 | Repository migrations (65) vs `hzppst` history (5) | History does not explain live objects | Expected repository/dump drift | Regression | Baseline from confirmed source, not migration replay |
| C-03 | Repo cadre-hours view vs dump fixed 7h view | Calculation differs | **RESOLVED — CADRE** (DR-IMP06-002) | Was High | Use cadre when available; else 7h |
| C-04 | Repo soft-cancel sync vs dump hard-delete sync | Daily declaration absence differs | **RESOLVED — Soft Annulee** (DR-IMP06-001) | Was High | No hard delete; set `annulee` |
| C-05 | Repo zone-chef RESTRICT vs dump CASCADE | User deletion effect differs | Regression-risk integrity drift | High | Confirm desired deletion semantics |
| C-06 | Repo realtime publication vs dump empty publication | FE subscriptions may not receive events | Expected deployment drift; regression risk | Medium | Confirm runtime publication |
| C-07 | CVL role `admin` vs brief Super Admin | CVL has no global Super Admin/company flow | Expected scope gap, not conflict | High if assumed implemented | Defer unless product explicitly decides Flow H |
| C-08 | CVL `nb_deplacements` column/view vs sync upsert | Sync omits the field | **RESOLVED — Preserve omit on sync** (DR-IMP06-003 P+) | Medium | Do not write nb_deplacements in DeclarationSync |
| C-09 | Auto-approve expectation vs `validated_by` | Auto approval lacks validator attribution | **RESOLVED — Fix audit** (DR-IMP06-003 F) | Medium | Auto-approve must set validated_by + validated_at |
| C-10 | Zone-ouvrier insert policy label vs command | “insert” policy is `FOR SELECT` in dump | Regression/security risk | High | Do not reproduce defect; product/security decision |

“Expected” means the evidence sources reasonably describe different deployment/history states. It is not an approval to ignore a potential runtime regression.
