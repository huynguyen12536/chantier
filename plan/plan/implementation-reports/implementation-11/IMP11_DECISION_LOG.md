# IMP11_DECISION_LOG — Ownership decisions only

**Date:** 2026-07-15  
**Type:** Investigation — Decision Requests for Human  
**Scope:** Only **true ownership / phase-split** decisions. Not re-litigation of inventable product features.

---

## Already decided (do not reopen)

| Topic | Binding decision | Evidence |
|---|---|---|
| Super Admin / Company / Flow H | **Out of scope / Deferred** | Project `decision_log.md`; Flow H “CHƯA CÓ” |
| Imp-04 Chantiers ownership | Imp-04 | WAVE2 + schema 003 |
| Imp-05 Zones / Affectations ownership | Imp-05 | WAVE2 + schema 004 |
| Imp-06–09 business | Frozen / Closed as delivered | Wave 2 history |
| FE source edits | Frozen → adapters Imp-12 | Execution Manual |
| DB evolution | Additive only; no DROP/rename | DATABASE_EVOLUTION / UNION policy |
| Phone is invent? | **No** — CVL column; UNION preserve | `database-schema.md`; Edge; FE |

---

## OPEN — ownership only

### DR-IMP11-001 — Imp-11 REST vs Imp-12 adapters

| | |
|---|---|
| **Question** | Who owns Edge `/functions/create-user|delete-user` and RPC `/rpc/delete_chantier_cascade` path shapes? |
| **Why ownership** | Capability already exists as REST (Imp-03/04). Path aliases are FE compatibility, not new Admin business. |
| **Options** | **A** Imp-11 = REST Admin only; Imp-12 = adapters (**default per WAVE2**) · **B** Imp-11 also ships adapters now |
| **Blocks** | Phase boundary clarity |
| **Matrix** | A-14, A-15, D-03 → Cat 6 |

### DR-IMP11-002 — Authorize Imp-11 additive migration (UNION schema)

| | |
|---|---|
| **Question** | May Imp-11 own the **single** additive migration: `profiles.phone` + nonempty `matricule` UNIQUE index? |
| **Why ownership** | Cat 4 work must have a phase owner; DDL not Invent. |
| **Options** | **A** Yes Imp-11 · **B** Defer DDL to another schema wave (creates UNION debt) |
| **Blocks** | Cat 4 execution |
| **Matrix** | ID-06, ID-04 |

### DR-IMP11-003 — Admin “auditable” without new BC table

| | |
|---|---|
| **Question** | Does Imp-11 satisfy WAVE2 “auditable” via **structured logs only** (no new audit table)? |
| **Why ownership** | Avoid inventing Imp-07-like table inside Admin BC without CVL evidence. |
| **Options** | **A** Logs only · **B** New admin audit table (explicit invent-yes) · **C** No extra audit |
| **Blocks** | DoD wording only (non-blocking for PATCH) |
| **Matrix** | O-02 |

---

## NOT a Decision Request (resolved by evidence → Category)

| Topic | Category | Owner action |
|---|---|---|
| PATCH user fields | Cat 3 + Cat 5 | Imp-11 after DR-001 = A |
| Demotion guards (read Imp-05) | Cat 5 | Imp-11 — **read only** zones/affectations |
| Sync affectations on promote | Cat 2 | Keep Imp-05 POST; no Imp-11 rewrite |
| Create/delete/list users | Cat 1 | Imp-03 — no reimplement |
| `password_hash` / `actif` / refresh | Cat 1 | Imp-02 — keep forever |
| Nom/prenom required on write | Cat 5 (validation) | Imp-11 service rules; no SET NOT NULL rewrite |

---

## Gate

| Ready to code Imp-11? | After Human records **DR-IMP11-001** and **DR-IMP11-002** in project Decision Log |
|---|---|
| Production code in this task? | **No** |
