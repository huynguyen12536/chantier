# IMP11_DECISION_LOG_UPDATE — after Merge Capability Matrix

**Date:** 2026-07-15  
**Supersedes approach in:** earlier `IMP11_DECISION_REQUESTS.md` (gap “Missing” framing)  
**Rule:** Close only when evidence supports; do not invent business.

---

## 1. Reframed gate (UNION)

Imp-11 investigation is now a **merge matrix**, not a replace-CVL gap list.

| Question | Answer after re-investigation |
|---|---|
| Is any Administration **business** absent from both systems? | Almost none — edit/promote/demote/phone **exist in CVL**; create/delete/list/`actif`/credentials **exist in Unified**. |
| Can coding start with zero Human input? | **Still no** — ownership/phase DRs remain. |
| Is Super Admin reopenable? | **No** — already Deferred in project Decision Log. |

---

## 2. Decision Requests (updated)

### DR-IMP11-001 — REST Administration vs Imp-12 adapters  
**Status:** OPEN (blocking for phase split)

| | |
|---|---|
| **Question** | Confirm Imp-11 delivers Unified REST Administration (PATCH + demotion + phone wiring); Imp-12 delivers Edge/RPC/table adapters. |
| **Evidence** | WAVE2 Imp-11 vs Imp-12; fe_contract_matrix; matrix A-14/A-15/D-03 = Deferred Imp-12; A-07/A-08 = Imp-11 REST/business |
| **Recommended** | **A** — Imp-11 REST-only lifecycle; Imp-12 adapters |
| **May close when** | Human picks A or B in Decision Log |

### DR-IMP11-002 — Additive `profiles.phone` (+ optional matricule UNIQUE)  
**Status:** OPEN → **evidence strongly supports Yes (UNION)**

| | |
|---|---|
| **Question** | Authorize **one** additive migration for CVL `phone` (and nonempty `matricule` UNIQUE) under UNION policy? |
| **Evidence** | `database-schema.md` phone; Edge insert; FE required; Unified 002 lacks phone; Schema Merge Report §5 |
| **Reframe** | This is **not** inventing a feature — it is **preserving CVL column in the UNION**. |
| **Recommended** | **A** — Yes, Imp-11 additive migration |
| **May close when** | Human records A (or explicit B with known FE parity debt) |

### DR-IMP11-003 — Admin audit form  
**Status:** OPEN (non-blocking for PATCH if logs accepted)

| | |
|---|---|
| **Question** | How to satisfy “auditable” without inventing CVL-absent audit table? |
| **Evidence** | No CVL management audit table; Imp-07 audit is Flow E BC |
| **Recommended** | **A** — structured application logs only |
| **May close when** | Human picks A/B/C |

### DR-IMP11-004 — Nom/prenom nullability enforcement  
**Status:** OPEN (lightweight)

| | |
|---|---|
| **Question** | Enforce CVL NOT NULL nom/prenom via **service validation** on create/PATCH (keep nullable columns) rather than ALTER SET NOT NULL? |
| **Evidence** | CVL NOT NULL; Unified nullable; UNION additive prefers no aggressive SET NOT NULL on legacy null rows |
| **Recommended** | **A** — service validation only |
| **May close when** | Human confirms A |

---

## 3. Closed / not opened (evidence)

| Topic | Decision | Evidence |
|---|---|---|
| Super Admin / Flow H | **Stay Deferred** | Project Decision Log; Flow H “CHƯA CÓ” |
| Imp-04/05 rewrite in Imp-11 | **Forbidden** | Ownership matrix; reuse |
| Imp-09 SSE reopen | **Forbidden** | Imp-09 CLOSED |
| Treating phone as “Missing business” | **Rejected framing** | Phone exists in CVL — additive SQL |

---

## 4. Implementation readiness

| Gate | Met? |
|---|---|
| Merge Capability Matrix complete coverage | **Yes** (`IMP11_MERGE_CAPABILITY_MATRIX.md`) |
| Schema UNION additive-only | **Yes** (report) |
| Ownership boundaries | **Yes** (`IMP11_IMPLEMENTATION_SCOPE.md`) |
| Human DR answers recorded | **No** — waiting |
| Production code authorized | **No** |

**Finalize Imp-11 implementation plan for coding only after DR-IMP11-001 and DR-IMP11-002 are answered in the project Decision Log.**

---

## 5. Prior document note

`IMP11_DECISION_REQUESTS.md` and earlier gap tables that used the word “Missing” for phone/PATCH are **superseded in method** by this merge pack. Capabilities are reclassified as Needs REST / Needs additive SQL / Needs Admin business / Deferred.
