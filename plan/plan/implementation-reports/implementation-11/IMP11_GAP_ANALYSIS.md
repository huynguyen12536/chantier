# IMP11_GAP_ANALYSIS — Administration

> **Method note:** Superseded for planning by `IMP11_MERGE_CAPABILITY_MATRIX.md`.  
> Do not use “Missing” when capability exists in CVL or Unified — use merge categories instead.

**Date:** 2026-07-15  
**Type:** Investigation only  
**Does not implement.**

---

## 1. Verdict (start Imp-11?)

| Question | Answer |
|---|---|
| Can coding start **immediately** with zero open questions? | **No** — at least **DR-IMP11-001** (adapter ownership Imp-11 vs Imp-12) should be answered; optionally **DR-IMP11-002** (phone column) and **DR-IMP11-003** (admin audit expectation). |
| Can analysis proceed / human review this pack? | **Yes** |
| Are Imp-05–09 frozen? | **Yes** — Imp-11 must not rework them; only **consume** Imp-02/03/04/05 APIs and add missing admin lifecycle. |
| Is Super Admin in scope? | **No** — Decision Log Deferred |

**Practical gate:** After confirming Imp-11 owns **REST user PATCH + role demotion guards** and Imp-12 owns Edge/RPC path aliases, Imp-11 coding can start without inventing rules.

---

## 2. Classification summary

| Class | Count (approx) | Examples |
|---|---|---|
| Already implemented | High | User create/delete, list; chantiers; affectations; zones; cascade delete |
| Partially implemented | Low | chef_equipe_id on assign without promote sync; matricule format |
| Missing (Imp-11 candidate) | Core gap | PATCH user; promote/demote + FE demotion guards server-side; phone field |
| Deferred Decision Log | Explicit | Flow H Super Admin / multi-company |
| Deferred Imp-12 | Adapters | `/functions/create-user`, `/functions/delete-user`, `/rpc/delete_chantier_cascade` |

---

## 3. Gap detail — Missing / Partial (Imp-11 concern)

### G-01 — User profile UPDATE / role lifecycle (**Missing**)

| | |
|---|---|
| CVL | FE `profiles` UPDATE; Flow C promote; demotion guards |
| Unified | No `PATCH /api/users/:id` |
| Impact | Management hub cannot edit/promote via Unified API |
| Invent forbidden | Reuse FE guard semantics (affectation chef + zone chef; admin role lock) |

### G-02 — Demotion authorization on server (**Missing**)

| | |
|---|---|
| CVL | Block demote chef if active `chef_equipe_id` on affectations OR owns zone |
| Unified | Zone ownership only blocks **delete**, not role change |
| Impact | Unsafe demote if FE bypassed |
| Imp-11 | Enforce on role PATCH |

### G-03 — `profiles.phone` (**Missing** schema)

| | |
|---|---|
| CVL | `database-schema.md` phone; Edge + FE |
| Unified | No column in migrations; createUser omits phone |
| Impact | Create/edit parity incomplete vs FE required phone |
| Note | Additive migration is consistent with UNION DB policy **if** Human authorizes Imp-11 to own it (DR-IMP11-002) |

### G-04 — Promote → sync `affectations.chef_equipe_id` (**Partial**)

| | |
|---|---|
| CVL | FE `promoteChefsToChefEquipe` + `syncChantierAffectationManagers` |
| Unified | POST affectation can set `chef_equipe_id`; no automatic promote side-effect |
| Imp-11 | Optional side-effect on promote **or** keep client-driven like CVL FE — prefer server enforce when role→chef_equipe if Human wants; default evidence = FE-driven sync exists so document both |

### G-05 — Edge/RPC FE paths (**Deferred Imp-12**)

Not an Imp-11 coding blocker if REST contracts ship first; frozen FE still calls Edge until Imp-12.

### G-06 — Management access for `administratif` (**Not a BE gap**)

FE `canAccessManagement` = admin|chef only. Edge create allows administratif. Preserve both: API create stays administratif+admin; UI access remains FE freeze.

### G-07 — Admin auditability (**Ambiguous**)

WAVE2 acceptance says “auditable”; CVL management screens do not show an audit table for user edits. Imp-07 has approval audit — different BC. Needs Decision whether Imp-11 adds structured logs only vs new audit table (DR-IMP11-003).

---

## 4. Already done — do **not** re-implement

| Module | Keep frozen |
|---|---|
| Imp-03 | create/delete/list users |
| Imp-04 | chantier CRUD + cascade |
| Imp-05 | affectations + zones ownership |
| Imp-06–09 | unrelated |

---

## 5. Risks if Imp-11 codes without DRs

1. Building Edge aliases inside Imp-11 then Imp-12 duplicates.  
2. Adding `phone` without additive migration approval / naming.  
3. Inventing admin audit table without CVL evidence.  
4. Touching Imp-05 zone business “to finish promote” incorrectly.

---

## 6. Recommended answer shape for humans

1. Close **DR-IMP11-001** (REST Imp-11 / adapters Imp-12).  
2. Close **DR-IMP11-002** (phone additive in Imp-11: Yes/No).  
3. Close **DR-IMP11-003** (audit = structured log vs table vs none).  
4. Then authorize Imp-11 implementation plan in `IMP11_IMPLEMENTATION_PLAN.md`.
