# IMP06_CVL_PARITY_REPORT — Current Verified Legacy Parity

**Role:** Architecture Review (read-only)  
**CVL sources:** `migration-analysis/SUMMARY.md`, `business-flows.md`, `database-schema.md`, `rls-analysis.md`, `functions/*`, `triggers/*`, `production-dump/*`, Merge Spec conflicts as resolved only where DR cited.

**Rule:** Winner of DR supersedes dump-only conflict where Decision Log binds. Field shapes & RLS outcomes not covered by DR remain CVL-binding.

---

## 1. SUMMARY business rules #5–#15

| Rule | CVL | Imp-06 delivery | Parity |
|---|---|---|---|
| #5 Unique declaration | UNIQUE (user, chantier, date) | UNIQUE + upsert | **PASS** |
| #6 Multi periods; fin null ↔ en_cours | dump CHECK | Multi OK; **CHECK absent** | **FAIL** (CHECK) |
| #7 Empty active → annulee (repo) / DELETE (dump) | DR-001 Soft Annulee | softAnnulee, no DELETE | **PASS** (winner) |
| #8 Validate/reject → periods terminee\|en_cours / validated | sync_periods | PeriodPropagation on decide | **PASS** (happy path) |
| #9 Auto-approve exact prior validated shift | auto_approve fn | sameShift 1 active period | **PASS** structure; field `panier` vs dump `panier_repas` |
| #10 Cadre else 7h | repo cadre / dump 7h view | DR-002 CADRE | **PASS** winner intent; **WARNING** column source |
| #11 Chef scope assignment/zone/supervised | RLS + get_chef_chantier_ids | Role gate only | **FAIL** |
| #12 Ouvrier site = affectation ∪ zone | Flow D + AuthContext | Not enforced on write | **FAIL** |
| #13 Cascade delete chantier | Imp-04 RPC | Out of Imp-06 own | N/A / tolerate |
| #14 Export validated | Flow F | Imp-08 | Out of Imp-06 |
| #15 Resubmit rejetee→terminee | RLS | Allowed for owner | **PASS** path |

---

## 2. Trigger / Function / RPC parity

| Legacy | Replacement | Behavioral parity |
|---|---|---|
| `trigger_sync_declarations` + `sync_declarations_from_periods` | DeclarationSyncService | Soft Annulee winner OK; omit nb_deplacements OK; **synth columns / panier name diverge** |
| `trigger_sync_periods_from_declaration` + `sync_periods_from_declaration` | PeriodPropagationService | Core OK |
| `trigger_auto_approve_*` + `auto_approve_if_matches_latest_validated_shift` | AutoApprovalPolicyService | Match rule OK; audit **improved** vs CVL gap (DR-003 F) |
| `calculer_duree_periode` / `minutes_from_time` | timeUtility | PASS structure |
| `calculer_heures_cadre_chantier` | calculation.splitHours | Intention OK; cadre window assembly **WARNING** |
| View `synthese_heures_journalieres` | synthesizeDay | Dump view uses 7h + bool_or panier; Imp-06 CADRE + count paniers — **intentional DR-002 drift vs dump view**; panier aggregate **WARNING** |
| `auto_approve_week_suggestion_replication` | Deferred | **PASS** (absent hzppst; FE commented) |
| `delete_chantier_cascade` | Imp-04 | Not re-owned |

---

## 3. Schema / Constraint parity (dump)

| Dump element | Imp-06 `005_timesheet.sql` | Parity |
|---|---|---|
| `panier_repas` | `panier` | **FAIL** |
| `latitude_debut` NOT NULL + lon debut NOT NULL | optional `latitude`/`longitude` | **FAIL** |
| `latitude_fin` / `longitude_fin` | absent | **FAIL** |
| `commentaire` | absent | **FAIL** (CVL column) |
| Period open CHECK | absent (only heure_fin≥debut) | **FAIL** |
| GPS coherence CHECK | absent | **FAIL** |
| Declaration heures 0–24 CHECK | absent | **FAIL** |
| `nb_paniers` 0–2 CHECK | absent | **FAIL** |
| UNIQUE declaration | present | **PASS** |
| Period statut enum | present | **PASS** |
| Declaration statut enum | present | **PASS** |
| NUMERIC precision | (6,2) vs dump (often 4,2 hours) | WARNING |

---

## 4. RLS outcome parity

| Outcome (rls-analysis) | Imp-06 | Parity |
|---|---|---|
| Anonymous denied | requireAuth | **PASS** |
| Ouvrier INSERT own only | ouvrier must match userId | **PASS** identity |
| Ouvrier cannot write foreign chantier without membership | no membership check | **FAIL** (#12) |
| Chef SELECT scoped | list unscoped | **FAIL** |
| Chef UPDATE periods in scope | chef always allowed | **FAIL** |
| Administratif broad read | broad list | Approximate PASS |
| Admin full | yes | Approximate PASS |
| Decide roles (chef/admin/administ.) | requireRoles | Role **PASS**; scope **FAIL** |

---

## 5. Flow parity

| Flow | Parity | Notes |
|---|---|---|
| D | Partial | Sync OK; gate/shape FAIL |
| E | Partial | Decide+propagate OK; scope FAIL |
| F | N/A Imp-06 | Export later |
| G | Not covered | Period multi-insert only via FE historically |

---

## 6. Overall CVL parity score

| Area | Score |
|---|---|
| DR winners (C-03/04/08/09 binding) | **PASS** |
| Trigger replacement architecture | **PASS** |
| Schema / FE field CVL | **FAIL** |
| AuthZ outcomes #11/#12 | **FAIL** |
| End-to-end Flow D readiness | **FAIL** |

**CVL Parity: FAIL (partial mechanics only).**
