# IMP11_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** **FINAL / LOCKED / CLOSED**  
**Phase:** Imp-11 **COMPLETE / CLOSED**  
**Runtime head:** `2d3ddaed70`  
**Architecture seal:** `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`  
**Human:** Implementation Review ACCEPTED · Formal Closure APPROVED  

All DRs below are **CLOSED**. Do **not** reopen without new Human authorization.

---

## Final ratified seal

```
DR-IMP11-001 = A
DR-IMP11-002 = A
DR-IMP11-003 = A
DR-IMP11-004 = A
DR-IMP11-005 = B
DR-IMP11-006 = A
```

| DR | Winner | Status | Meaning |
|---|---|---|---|
| 001 | A | **CLOSED** | REST Admin = Imp-11; adapters = Imp-12 |
| 002 | A | **CLOSED** | Additive phone + nonempty matricule UNIQUE |
| 003 | A | **CLOSED** | Structured logs only |
| 004 | A | **CLOSED** | Zod nom/prenom validation |
| 005 | B | **CLOSED** | No promote → affectation sync |
| 006 | A | **CLOSED** | PATCH = admin only |

---

## DR detail (frozen)

### DR-IMP11-001 — REST Administration vs Imp-12 adapters

| Option | Description |
|---|---|
| **A (CLOSED)** | Imp-11 = REST Admin; Imp-12 = Edge/RPC/table adapters |
| B | Imp-11 also implements Edge adapters |
| C | Defer all admin REST until Imp-12 |

### DR-IMP11-002 — Schema UNION

| Option | Description |
|---|---|
| **A (CLOSED)** | One additive migration: phone + nonempty matricule UNIQUE |
| B | Phone only |
| C | Defer schema |

### DR-IMP11-003 — Admin audit

| Option | Description |
|---|---|
| **A (CLOSED)** | Structured application logs only |
| B | New admin_audit table |
| C | Reuse Imp-07 approval_audit |

### DR-IMP11-004 — Nom / prenom validation

| Option | Description |
|---|---|
| **A (CLOSED)** | Service Zod on create + PATCH |
| B | DB CHECK only |
| C | FE-only |

### DR-IMP11-005 — Promote → affectation chef sync

| Option | Description |
|---|---|
| A | Server sync on promote |
| **B (CLOSED)** | No Imp-05 write from Imp-11 |
| C | Unrecorded deferral |

### DR-IMP11-006 — PATCH actor role

| Option | Description |
|---|---|
| **A (CLOSED)** | admin only |
| B | admin + administratif |
| C | Any authenticated |

---

**Super Admin / Flow H:** remain Deferred (project Decision Log).  
**Closure:** `IMP11_FINAL_CLOSURE.md`.
