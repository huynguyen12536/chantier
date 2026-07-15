# IMP11_DECISION_REQUESTS — Administration gate

> **Superseded in method by** `IMP11_DECISION_LOG_UPDATE.md` + `IMP11_MERGE_CAPABILITY_MATRIX.md` (UNION merge framing; no “Missing” when business exists).  
> Keep this file for history; prefer the Update doc for Human answers.

**Date:** 2026-07-15  
**Module:** Imp-11  
**Status:** OPEN — answer before Imp-11 coding  
**Rule:** Do not invent; do not reopen Imp-05–09.

---

## Gate summary

| Can Imp-11 start coding immediately? | **Not until at least DR-IMP11-001 is answered.** |
|---|---|
| Blocking? | Yes for clean ownership; plan ready otherwise |
| Super Admin / Flow H | Already **Deferred** by Decision Log — do not reopen |

---

## DR-IMP11-001 — Imp-11 vs Imp-12 adapter ownership

### Question
Does Imp-11 deliver only Unified REST Administration (PATCH users + demotion guards [+ phone]), leaving frozen FE Edge/RPC path adapters to **Imp-12**?

### Context
- FE frozen calls `POST /functions/v1/create-user|delete-user` and RPC `delete_chantier_cascade`.  
- Imp-03/04 already expose REST equivalents.  
- fe_contract_matrix / FE_COMPATIBILITY_ADAPTERS assign adapters to cutover wave.  
- WAVE2: Imp-11 = Administration ops; Imp-12 = Integration Adapters.

### Options

| ID | Option |
|---|---|
| **A** | **Imp-11 = REST-only lifecycle gaps**; Imp-12 = `/functions/*` + RPC/table adapters (**recommended by roadmap split**) |
| **B** | Imp-11 also ships Edge-compatible adapter routes now |
| **C** | Defer all user PATCH until Imp-12 (keeps Administration incomplete) |

### Blocking effect
Without choice, implementer may duplicate Imp-12 work or leave FE contract unassigned.

---

## DR-IMP11-002 — `profiles.phone` additive column

### Question
May Imp-11 add **additive** `profiles.phone` (CVL dump / Edge / FE required) under UNION DB policy?

### Context
- `migration-analysis/database-schema.md`: phone exists on prod.  
- Unified migrations: **no phone**.  
- FE create requires phone.

### Options

| ID | Option |
|---|---|
| **A** | Yes — Imp-11 additive migration + wire create/PATCH |
| **B** | No — keep Unified without phone until separate schema Imp; FE adapters tolerate null/omit |
| **C** | Defer phone to Imp-12/profile adapter only (store elsewhere) — weak vs dump |

### Blocking effect
Ambiguous for create-user parity vs FE required field.

---

## DR-IMP11-003 — Admin action auditability

### Question
What satisfies WAVE2 Imp-11 acceptance “auditable” for user role/profile changes?

### Context
- CVL management UI has **no** dedicated admin audit table evidenced.  
- Imp-07 has declaration decision audit — different BC.  
- Do not invent schema without authority.

### Options

| ID | Option |
|---|---|
| **A** | Structured application logs only (no new table) |
| **B** | New additive admin_audit / reuse approval_events pattern (needs explicit Yes) |
| **C** | No audit beyond existing HTTP/access logs |

### Blocking effect
Low for core PATCH; medium for claiming “auditable” DoD.

---

## Non-DR facts (already decided)

| Topic | Status |
|---|---|
| Super Admin / multi-company / Flow H | Decision Log **out of scope** |
| Roles enum 4 values | SHARED #1 |
| Create = admin\|administratif; delete = admin | SHARED #2 |
| No self-delete; zone chef delete block | SHARED #3 |
| SSE / Imp-09 | Closed — untouched |
| FE code under chantier1 | Frozen |

---

## Recommended sequencing for Human

1. Answer **DR-IMP11-001** (A recommended).  
2. Answer **DR-IMP11-002**.  
3. Answer **DR-IMP11-003** (A recommended if no invent).  
4. Authorize Imp-11 implementation using `IMP11_IMPLEMENTATION_PLAN.md`.  
5. **STOP** agents from coding until then.
