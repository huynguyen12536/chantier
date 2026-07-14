# VALIDATION_REPORT — Imp-06

| Gate | Result | Evidence |
|---|---|---|
| Unit Tests | PASS | CADRE / duration domain test |
| Integration Tests | PASS | HTTP periods + declarations + DB |
| Regression Tests | PASS | Imp-01…05 still green (17/17) |
| Architecture Validation | PASS | Express modular; services own rules; repo = SQL |
| Business Validation | PASS | Soft Annulee, CADRE, audit fix, omit nb_deplacements |
| Legacy Mapping Validation | PASS | triggers/functions → named services |
| API Contract Validation | PASS | Auth + decide roles; FE untouched |
| Transaction Validation | PASS | withTransaction on write paths |
| Permission Validation | PASS | ouvrier 403 on decide |

## Overall
**ALL GATES PASS**

## Known limitations (non-blocking)
- Zone-scoped chef ownership finer than role gate → Imp-07.  
- Legacy FE path aliases (`/api/validation/...`) → Imp-07 if contract requires.
