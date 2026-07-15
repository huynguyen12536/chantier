# IMP11_DECISION_LOG — Ownership decisions (CLOSED for implementation)

**Date:** 2026-07-15  
**Implementation authorization:** Human UNION MERGE prompt — DRs closed as follows.

| DR | Winner | Applied in code |
|---|---|---|
| DR-IMP11-001 | Imp-11 = REST Admin; Imp-12 = adapters | No Edge/RPC in Imp-11 |
| DR-IMP11-002 | Imp-11 owns additive migration phone + matricule UNIQUE nonempty | `010_imp11_admin_profiles.sql` |
| DR-IMP11-003 | Structured application logs only | `logger.info('admin.user.*')` |
| DR-IMP11-004 / Decision 4 | nom/prenom service validation | Zod on create/PATCH |

Do not reopen. Super Admin / Flow H remain Deferred.
