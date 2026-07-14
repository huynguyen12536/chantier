# AGENTIC_FLOW_REFACTOR_REPORT

**Date:** 2026-07-14  
**Type:** Governance / Agentic Flow only — **no** Backend code, API, Entity, or data migration.  
**Decision:** Project direction → **Consolidation + Replatforming**  
**Evidence:** Decision Log 2026-07-14 (Architecture)

---

## 1. Verdict

Agentic Flow đã được refactor để phản ánh mục tiêu mới: **hợp nhất hai hệ legacy → 1 Frontend + 1 Backend + 1 PostgreSQL**, Backend thay thế hoàn toàn Supabase.

**Phase 0–2 kết quả RE giữ nguyên** (diễn giải lại là Legacy Analysis).  
**Phase 3+ redesign** với **Merge Specification** làm SoT thiết kế.  
**Chưa sẵn sàng Unified Backend Design** cho đến khi Merge Spec Done (+ Legacy B identified).

---

## 2. Những giả định cũ đã loại bỏ / vô hiệu hóa

| # | Giả định cũ | Trạng thái sau refactor |
|---|---|---|
| 1 | Dự án = reverse-engineer **một** Supabase rồi migrate | ❌ Loại — mục tiêu = Consolidation 2 hệ |
| 2 | **Clone / rebuild Supabase** (PostgREST + Edge + Auth nguyên trạng) | ❌ Loại — thiết kế Backend application mới |
| 3 | **Migration 1:1** table/RPC/RLS parity làm đích | ❌ Loại — Unify / Transform / Drop theo Merge Spec |
| 4 | **Backend clone** của một project ref | ❌ Loại |
| 5 | **Production Source of Truth** = một Runtime DB được promote rồi lock Backend | ❌ Vô hiệu hóa cho Unified SoT — dump/refs = **Legacy evidence** |
| 6 | **Production Validation / Runtime Database Validation** là hard gate duy nhất trước mọi design | ❌ Tách thành Track L (labeling); design Gate = Merge Spec + System B |
| 7 | `migration-analysis/` = SoT runtime/design đích cuối | ❌ Relabel **Legacy Analysis**; SoT thiết kế = Merge Spec |
| 8 | Phase 3 = Business Domain Modeling (single system) sau P2 Gate | ❌ Superseded → Phase 3 = **Merge Specification** |
| 9 | Phase 4 = Backend Architecture ADR ngay sau Domain | ❌ Dời → Phase 7; trước đó Domain/DB/Logic unified |
| 10 | Phase 5 = Authentication Migration sớm | ❌ Auth nằm trong Merge Spec + Phase 6–9 |
| 11 | afgveikz + hzppst **tự động** = hai product systems A/B | ❌ Cấm suy diễn — Product phải định danh A/B |
| 12 | “Waiting External Confirmation” chặn **mọi** Phase 3 | ⚠️ Nới — P2 Gate = Track L; Consolidation có thể tiến nếu Track C (A+B) đủ |

---

## 3. Inventory — nơi giả định cũ từng xuất hiện (đã xử lý)

### `plan/plan/`

| Artifact | Hành động |
|---|---|
| `00_README_EXECUTION.md` | **Viết lại** Master Plan Consolidation |
| `01_CURRENT_SYSTEM_STATE.md` | Relabel Legacy SoT chain |
| `02_PRP_AI_Execution_Playbook.md` | SoT tiers + Consolidation mission |
| `03_AGENT_ROUTING.md` | Thêm Merge / Unified / identity-merge routing |
| `04_GLOBAL_GATES.md` | Gates Merge Spec + chống PostgREST-clone |
| `05_RISK_REGISTER.md` | R-20–R-33 merge/conflict risks |
| `READY_FOR_EXTERNAL_CONFIRMATION.md` | Track L + Track C addendum |
| `NEXT_ACTION_MATRIX.md` | Scenarios A–D = labeling; Track C = Merge Spec |
| `PROJECT_EXECUTION_READINESS.md` | Verdict Consolidation |
| `MIGRATION_READINESS_REVIEW.md` | Addendum — không phải Unified readiness |
| `DEPENDENCY_GRAPH_REVIEW.md` | Historical graph; authoritative = Master Plan |
| `tracking/status_board.md` | Roadmap mới P3–P14 |
| `tracking/decision_log.md` | Direction-change row |
| `tracking/TRACKING_PLAYBOOK.md` | Merge evidence paths |
| `templates/PHASE_TEMPLATE.md` | Legacy/Merge/Unified Inputs |
| `phases/PREREQUISITE_CHECKLISTS.md` | Superseded + Consolidation Gate |
| `phases/README.md` | Index roadmap mới |

### Phases

| Folder | Hành động |
|---|---|
| `phase_03_merge_specification/` … `phase_14_production_rollout/` | **Tạo mới** PHASE.md |
| `phase_03_business_domain_modeling/` | SUPERSEDED (giữ lịch sử) |
| `phase_04_backend_architecture/` | SUPERSEDED |
| `phase_05_authentication/` | SUPERSEDED |
| `phase_01_*` / `phase_02_*` | **Không sửa kết quả** |

### `migration-analysis/`

| Artifact | Hành động |
|---|---|
| `README.md` | Phân loại Legacy / Merge / Unified |
| `00-IMPORTANT-FINDINGS.md` | Banner Legacy Analysis |
| `SOURCE_OF_TRUTH_DECISION.md` | Consolidation addendum |
| `merge/README.md` | Placeholder Merge Analysis |
| `unified/README.md` | Placeholder Unified Analysis |
| RE facts (schema, dumps, flows, …) | **Giữ nguyên nội dung lịch sử** |

### Không xóa

Mọi tài liệu lịch sử Phase 0–2, dump, confirmation matrix, old prep packs.

---

## 4. Mục tiêu & kiến trúc đích (sau cập nhật)

### Goal

**Consolidation + Replatforming** — không Migration 1:1.

### Current (conceptual)

```
Frontend A ──► Supabase A
Frontend B ──► Supabase B
```

### Target

```
Unified Frontend
        │
Unified Backend      ◄── runtime application SoT
        │
Unified PostgreSQL   ◄── persistence SoT
```

Supabase A/B = **Legacy Sources** only (sau cutover).

### SoT chain

```
Legacy Sources (FE A/B, Supabase A/B, dumps, migrations)
        ↓
Merge Specification          ← design SoT (Phase 3)
        ↓
Unified Domain Model
        ↓
Unified Backend
        ↓
Unified Database
```

---

## 5. Roadmap — Phase được thiết kế lại

| Phase | Title | Notes |
|---|---|---|
| 0–2 | Historical RE / validation / dump | **Không sửa kết quả**; giữ Waiting External Confirmation trên Track L |
| **3** | **Merge Specification** | **Mới / NEXT** — mapping A↔B toàn diện |
| 4 | Unified Domain Discovery | Thay domain 1:1 cũ |
| 5 | Unified Database Modeling | Target PG unified |
| 6 | Business Logic Consolidation | Triggers/RPC/Edge → Keep/Port/Drop |
| 7 | Backend Architecture Design | ADR thay Supabase (ex-old P4) |
| 8 | Migration Strategy | Dual-legacy cutover strategy |
| 9 | API Contract | Unified FE→BE |
| 10 | Backend Implementation Planning | Plan only |
| 11 | Data Migration Planning | A+B ETL / identity |
| 12 | Testing Strategy | |
| 13 | Deployment / Cutover Strategy | |
| 14 | Production Rollout / Hypercare | |

User-requested “Merge Specification” = **Phase 3** (đặt trước Unified Design — đúng vai trò SoT).

---

## 6. Tài liệu mới được tạo

- `phases/phase_03_merge_specification/PHASE.md` … `phase_14_production_rollout/PHASE.md`
- `phases/*/SUPERSEDED.md` (old P3–P5)
- `migration-analysis/merge/README.md`
- `migration-analysis/unified/README.md`
- `AGENTIC_FLOW_REFACTOR_REPORT.md` (file này)

---

## 7. Gate thay đổi

| Gate | Trước | Sau |
|---|---|---|
| Trước Domain/Backend Design | Production SoT == Runtime DB | **Merge Spec approved** (+ System B or Decision Log) |
| Phase 2 External Confirmation | Hard block Phase 3+ | **Track L** labeling; soft for Consolidation design |
| Phase 3 start | Domain modeling after P2 | **Merge Spec** after Legacy A+B identity |
| Architecture Done | Could be confused with scaffold | **Phase 7 ADR** after Unified Logic |
| Unified SoT | Migrations or one dump | **Merge Spec → Unified Domain → Backend → PG** |
| G0 Planning | SoT = migration-analysis | Legacy Analysis + Merge Spec Gate + no B invent |

---

## 8. Risk Register — nhóm mới

Đã thêm: **R-20…R-33** — schema divergence, business rule / trigger / function / auth / permission conflicts, data merge, duplicate identities, FK conflicts, migration rollback, data integrity, tenant isolation, missing System B, relapse to clone/1:1.

---

## 9. Agentic Flow tổng quát (đã xác nhận)

```
Reverse Engineering (Legacy A, Legacy B)
        ↓
Consolidation (Merge Specification)
        ↓
Unified Design (Domain → DB → Logic)
        ↓
Backend Design (Architecture → API → Impl Plan)
        ↓
Migration Planning (Data + Cutover)
        ↓
Testing → Deployment → Rollout
```

**Không còn:** Clone Supabase · Rebuild Supabase · One-to-one Migration làm đích.

**Còn:** Thiết kế hệ thống mới dựa trên hợp nhất hai hệ cũ.

---

## 10. Mức độ sẵn sàng — Unified Backend Design

| Checkpoint | Status |
|---|---|
| Governance Consolidation | ✅ Ready |
| Legacy Analysis (workspace / candidate A) | ✅ Available |
| Legacy B | ❌ Missing — **hard Gate** |
| Merge Specification | ❌ Not started |
| Unified Domain / DB / Logic | ❌ Blocked on P3 |
| Backend Architecture Design (Phase 7) | ❌ **Not ready** |
| Implementation / API / Entity | ❌ Forbidden until design wave |

**Score (0–100) sẵn sàng bắt đầu Unified Backend Design: ~15**  
(chỉ governance + partial Legacy A; thiếu B + Merge Spec + Unified packs).

**Score sẵn sàng bắt đầu Phase 3 Merge Spec: ~55**  
(docs/gates sẵn; blocker = định danh & ingest System B hoặc Decision Log exception).

---

## 11. Ràng buộc đã tuân thủ

- [x] Không viết Backend / API / Entity  
- [x] Không migrate dữ liệu  
- [x] Không xóa tài liệu lịch sử  
- [x] Không sửa kết quả RE Phase 0–2 (chỉ banner/addendum/diễn giải)  
- [x] Phase 0–1–2 không làm lại  

---

## 12. Next human actions

1. Định danh chính thức Frontend A/B và Supabase A/B (và vai trò afgveikz / hzppst).  
2. Cung cấp artifacts System B nếu khác System A.  
3. Explicit start **Phase 3 — Merge Specification**.  
4. (Optional) Hoàn tất Track L Scenario A/B/C để label Legacy dumps.
