# IMP06_RISK_REPORT — Imp-06 Risk Assessment

**Role:** Architecture Review (read-only)  
**Cross-refs:** `plan/plan/05_RISK_REGISTER.md` (R-01 triggers, R-34 FE, R-39 claimed closed); CVL SUMMARY §4/§8; this review’s FAIL items.

---

## Risk table

| ID | Class | Description | Evidence | Likelihood | Impact | Level |
|---|---|---|---|---|---|---|
| RK-01 | Security / Integrity | Ouvrier declares on unassigned chantiers | no #12 gate; SUMMARY #12; Flow D | High | High | **Critical** |
| RK-02 | Security | Chef decides / lists outside team/zone scope | role-only; SUMMARY #11; rls-analysis | High | High | **High** |
| RK-03 | Migration / FE | Frozen FE cannot bind period rows (`panier_repas`, GPS) | FE types; dump; dto.js | High | High | **High** |
| RK-04 | Migration / FE | Chantier hours naming break CADRE UX/path | FE heure_debut/fin vs matin slots | High | Medium | **High** |
| RK-05 | Data Integrity | Missing open-state / GPS / hour CHECKs | dump vs 005 | Medium | High | **High** |
| RK-06 | Business | Cadre lunch flattening wrong normales/HS | calculation.js cadreFromChantier | Medium | Medium | **Medium** |
| RK-07 | Business | nb_paniers overcount vs bool_or / CHECK≤2 | synthesizeDay; dump view/CHECK | Medium | Medium | **Medium** |
| RK-08 | Concurrency | Dual declare race / dual chef approve lost update | Analysis §17; no FOR UPDATE; upsert softens only declaration | Medium | Medium | **Medium** |
| RK-09 | Production | Soft Annulee misses non-soumise with no active periods | softAnnulee WHERE soumise | Low | Medium | **Medium** |
| RK-10 | Production | System actor as admin-capable profile | 005 INSERT profiles role admin | Low | Medium | **Medium** |
| RK-11 | Performance | Unscoped list scans for chef/administ | listPeriods | Medium | Low–Med | **Medium** |
| RK-12 | Business | Flow G / overlap not covered → duplicate periods | business-flows G; FE overlap | Medium | Medium | **Medium** |
| RK-13 | Architecture | Dual decide entry timesheet vs validation | Imp-06/07 | Medium | Medium | **Medium** |
| RK-14 | Process | False PASS / TRACEABILITY overclaim | PIPELINE PASS vs REVIEW FAIL; #12 Binding | High | High | **High** |
| RK-15 | Trigger mitigation | Incomplete parity before cutover | SUMMARY §8 “bỏ trigger = gãy” | High if cutover early | High | **Critical** if production cutover assumed |

---

## Risk Register interaction

| Register item | Imp-06 claim | Review assessment |
|---|---|---|
| R-01 Triggers | Replaced by services | Structure OK; **behavior parity incomplete** → residual R-01 |
| R-34 FE contract | FE untouched | Untouched ≠ compatible; **R-34 remains open** for Imp-06 shapes |
| R-39 | Closed in IMPLEMENTATION_REPORT | **Premature** given Critical/High findings |

---

## Business risk narrative

Incorrect AuthZ (RK-01/02) yields statements and validations outside CVL worksite visibility — payroll/export downstream (Flow F) can ingest invalid data.

## Migration risk narrative

Cutover that disables triggers while FE still speaks dump column names breaks write path entirely (RK-03). Wave2 REST-only consumers hide the break until Imp-12 adapter.

## Production / security / performance

See RK-01, RK-02, RK-10, RK-11.

## Data integrity

See RK-05–RK-09, RK-12.

---

## Residual risk if Auto-Continue without remediation

Assuming Imp-07 builds on Imp-06 timesheet tables as source of truth: AuthZ holes and schema renames **compound** into Review & Approval and Export. Risk multiplies (RK-15).

**Do not treat Imp-06 risk posture as acceptable for production dual-run.**
