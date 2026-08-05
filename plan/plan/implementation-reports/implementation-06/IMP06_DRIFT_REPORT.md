# IMP06_DRIFT_REPORT — All Observed Drifts (beyond 3 DRs)

**Role:** Architecture Review (read-only)  
**Rule:** DR-IMP06-001/002/003 resolve C-04/C-03/C-08/C-09 as documented. This report lists **additional** drifts Imp-06 did not register as Decision Requests or Assumption deferrals.

---

## A. Resolved drifts (Decision Log — in scope, not blockers)

| ID | Topic | Winner | Notes |
|---|---|---|---|
| C-04 / DR-001 | Soft Annulee vs hard DELETE | Soft Annulee | Implemented |
| C-03 / DR-002 | CADRE vs fixed 7h view | CADRE | Implemented (see residual W-CADRE) |
| C-08 / DR-003 | nb_deplacements omit | Preserve omit | Implemented |
| C-09 / DR-003 | auto-approve missing validated_by | Fix audit | Implemented (intentional improvement vs dump gap) |

---

## B. Unregistered drifts discovered in Imp-06 delivery

| Drift ID | CVL / FE evidence | Imp-06 behavior | Severity | Decision present? |
|---|---|---|---|---|
| D-01 | dump + FE `panier_repas` | column `panier` | **Critical** (FE bind) | **No** |
| D-02 | dump GPS debut/fin NOT NULL / optional fin | single lat/lon optional | **Critical** | **No** |
| D-03 | dump `commentaire` on periods | omitted | Medium | **No** |
| D-04 | dump period open-state CHECK | omitted | High | **No** |
| D-05 | dump GPS coherence CHECK | omitted | High | **No** |
| D-06 | dump declaration hour/panier CHECKs | omitted | High | **No** |
| D-07 | SUMMARY #12 affectation∪zone required for declare | not enforced | **Critical** (AuthZ) | **No** (deferred quietly as “Imp-07” only for chef) |
| D-08 | SUMMARY #11 chef multi-layer scope | role-only gate | High | Deferred Imp-07 in notes — **not** Decision Log |
| D-09 | FE chantier `heure_debut`/`heure_fin` | matin/apres_midi only | High (CADRE FE path) | **No** |
| D-10 | dump view panier `bool_or`→0/1 | `nb_paniers += 1` per period | Medium | **No** |
| D-11 | Cadre lunch: two slots matin/apres_midi | flatten to one window debut→fin | Medium | **No** |
| D-12 | Hours NUMERIC dump precision | NUMERIC(6,2) | Low | **No** |
| D-13 | Soft Annulee only if declaration `soumise` | may leave stale non-soumise with 0 active periods | Medium | **No** |
| D-14 | Realtime publication for periods/declarations | none | Medium (FE Contract) | Imp-12 implied only |
| D-15 | Overlap validation (FE declare-day) | absent BE | Medium | **No** |
| D-16 | Batch multi-day insert contract | single POST | Medium | Analysis proposed; not shipped |
| D-17 | `administratif` can decide (API) | role allowed | Low/INFO vs zone policies | Consistent with API_COVERAGE; RLS finer for chef |
| D-18 | System actor profile role=`admin` + password hash | operational invent | Medium security | **No** Decision |
| D-19 | TRACEABILITY claims #12 Binding | false vs code | Process drift | Docs vs reality |
| D-20 | Analysis status BLOCKED vs UNBLOCKED | contradictory | Process | Internal |

---

## C. Drift categories

### Schema rename / shape (invent without Decision)
D-01, D-02, D-03, D-12

### Constraint weakening
D-04, D-05, D-06

### AuthZ widening / missing
D-07, D-08, D-17 (info)

### Calculation residual after DR-002
D-09, D-10, D-11

### Operational / platform
D-14, D-15, D-16, D-18

### Governance
D-19, D-20

---

## D. Conclusion

Imp-06 treated C-03/C-04/C-08/C-09 via DRs correctly, then introduced **new silent drifts** (especially D-01/D-02/D-07) that are as severe as original conflicts for FE Contract and security.

**Drift management grade: FAIL** — winners tracked; new invents untracked.
