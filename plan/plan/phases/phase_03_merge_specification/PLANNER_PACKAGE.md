# Phase 03 — Planner Package

**Agent:** Planner  
**Status:** ✅ Planner Done (2026-07-14)  
**Mode:** Execution · Backend-First · Frontend Frozen  
**Manual:** `../../AGENTIC_EXECUTION_MANUAL.md`  
**Next:** Human answers `DR-P3-001` → Architect Agent (không bỏ pipeline)

> Planner **không** viết Merge Spec nội dung business (trừ skeleton chờ DR) và **không** viết code.

---

## 1. Phase goal (from Master Plan)

Tạo **Merge Specification** = Level-1 Business Truth cho hợp nhất legacy → làm SoT trước Unified Domain / Backend.

Phase này = **docs / mapping only** — không Backend implementation, không sửa FE.

---

## 2. Inputs available vs missing

| Input | Status |
|---|---|
| Execution Manual | ✅ |
| Master Plan Phase 3 | ✅ |
| Legacy Analysis A (`migration-analysis/`) | ✅ |
| FE Contract (frozen workspace FE) | ✅ as contract surface |
| Decision Log / Risks | ✅ |
| System A/B official identity | ❌ → **DR-P3-001** |
| Legacy Analysis B | ❌ unless O1 |
| Merge Spec (Level 1) | ❌ not created yet (this phase output) |

---

## 3. Task Breakdown

| Task ID | Title | Type | Primary Agent (later) | Depends | Notes |
|---|---|---|---|---|---|
| P3_T00 | Resolve DR-P3-001 (A/B identity) | Decision | Human | — | **Gate** |
| P3_T01 | Merge overview + scope + principles | Documentation | Developer* | T00 | `merge/00_MERGE_OVERVIEW.md` |
| P3_T02 | FE Contract inventory (frozen) — endpoints/payloads/auth expectations from FE→Supabase usage | Analysis | Architect → Developer* | T00 | Contract matrix; no FE edits |
| P3_T03 | Schema mapping A↔B↔Target (or A↔env per DR) | Analysis | Developer* | T00, T01 | `schema_mapping.md` |
| P3_T04 | Business rules mapping + conflicts | Analysis | Developer* | T03 | `business_rules_mapping.md` |
| P3_T05 | Triggers mapping | Analysis | Developer* | T03–T04 | `triggers_mapping.md` |
| P3_T06 | Functions / RPC mapping | Analysis | Developer* | T03–T04 | `functions_rpc_mapping.md` |
| P3_T07 | Edge Functions mapping | Analysis | Developer* | T02 | `edge_functions_mapping.md` |
| P3_T08 | Auth mapping | Analysis | Developer* | T02 | `auth_mapping.md` |
| P3_T09 | Permissions / RLS mapping | Analysis | Developer* | T08 | `permissions_mapping.md` |
| P3_T10 | Storage mapping | Analysis | Developer* | T01 | N/A likely |
| P3_T11 | Realtime mapping | Analysis | Developer* | T02 | `realtime_mapping.md` |
| P3_T12 | Data merge mapping | Analysis | Developer* | T03 | `data_merge_mapping.md` |
| P3_T13 | Conflict register + open blockers | Analysis | Developer* | T04–T12 | `conflict_register.md` |
| P3_T14 | Architecture Validation of Merge Spec | Validation | Arch Validation | T13 | vs Legacy + Manual |
| P3_T15 | Business Validation mapping completeness | Validation | Business Validation | T14 | Trigger/Fn/RPC coverage |
| P3_T16 | Phase report pack + Human Approval | Documentation | Documentation | T15 | Stop for Human |

\*Trong phase docs-only, “Developer” = soạn deliverable mapping (không code `api-chantier/`).

---

## 4. Dependency Graph

```
DR-P3-001 (T00)
    │
    ▼
T01 Overview ──────► T02 FE Contract inventory
    │                      │
    ├──────────► T03 Schema
    │               │
    │               ├─► T04 Rules ─┬─► T05 Triggers
    │               │              ├─► T06 Functions/RPC
    │               │              └─► T12 Data merge
    │               └──────────────────┘
    │
    ├─► T07 Edge (from T02)
    ├─► T08 Auth (from T02) ─► T09 Permissions
    ├─► T10 Storage
    ├─► T11 Realtime (from T02)
    │
    ▼
T13 Conflict register
    ▼
T14 Architecture Validation
    ▼
T15 Business Validation
    ▼
T16 Phase Report Pack → HUMAN APPROVAL
```

---

## 5. Execution Order

1. **STOP** — Human resolves DR-P3-001  
2. Architect: boundaries + contract matrix outline (T02 design)  
3. Developer*: T01 → T03 → T04 → T05/T06/T12 → T07–T11 → T13  
4. Test Agent: checklist completeness / cross-ref tests (doc integrity)  
5. Review Agent: review **diff** of merge docs only  
6. Architecture Validation → Business Validation  
7. Documentation Agent: reports + status/decision/risk  
8. **Human Approval** — only then Phase 3 Done / Phase 4  

---

## 6. Out of scope this phase

- Sửa Frontend  
- Implement `api-chantier/` business code  
- Generate Entity/API production  
- Data migration  
- Promote Supabase dump = Unified SoT  

---

## 7. Pipeline checklist (Phase 3)

| Step | Status |
|---|---|
| Planner | ✅ Done (this package) |
| Architect | ⬜ Blocked on DR-P3-001 |
| Developer* | ⬜ |
| Test | ⬜ |
| Review | ⬜ |
| Architecture Validation | ⬜ |
| Business Validation | ⬜ |
| Documentation | ⬜ partial (Manual + DR + this pack) |
| Human Approval | ⬜ |
| Subagent reviews → commit + push | ⬜ after full pipeline PASS (interim governance commits OK if Human asks) |

Phase status: **IN PROGRESS — Planner complete; awaiting Decision Request DR-P3-001**
