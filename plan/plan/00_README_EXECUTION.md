# Chantier — Agentic Flow (Execution Framework)

> **Master Plan** cho dự án **Consolidation + Replatforming**: hợp nhất **hai hệ thống legacy** (2 Frontend × 2 Supabase) thành **1 Frontend + 1 Backend + 1 PostgreSQL**.  
> **Không** phải migration 1:1 / clone Supabase / rebuild PostgREST+Edge nguyên trạng.

> **EXECUTION MODE (2026-07-14):** Backend-First · **Frontend FROZEN** (FE = Contract).  
> Operating rules: [`AGENTIC_EXECUTION_MANUAL.md`](AGENTIC_EXECUTION_MANUAL.md) — **bắt buộc** đọc trước khi làm task.  
> SoT đọc theo Manual Level 1→6 (Merge Spec → Unified Domain → Legacy → Decision → Risk → Master Plan).

## Mục tiêu dự án (đích)

```
Frontend A ──► Supabase A          Frontend B ──► Supabase B
        \                              /
         \         Phân tích          /
          \            │             /
           \           ▼            /
            \   Merge Specification /
             \         │           /
              ▼        ▼          ▼
            Unified Frontend
                    │
            Unified Backend  ◄── Source of Truth runtime mới
                    │
            Unified PostgreSQL
```

Backend mới **thay thế hoàn toàn** Supabase: Authentication, Authorization, RPC, Triggers, Edge Functions, Business Logic, RLS, Storage (nếu có), Realtime (nếu còn cần) → **application services**.

---

## Luồng Agentic tổng quát

```
Reverse Engineering (Legacy A, Legacy B)
        ↓
Consolidation (Merge Specification)
        ↓
Unified Design (Domain → DB → Logic)
        ↓
Backend Design (Architecture → API Contract → Impl Plan)
        ↓
Migration Planning (Data + Cutover)
        ↓
Testing → Deployment → Rollout
```

---

## Source of Truth (mô hình mới)

**Runtime reading order (Execution Manual):**

1. Merge Specification (Business Truth)  
2. Unified Domain Model (Architecture Truth)  
3. `migration-analysis/` (Legacy Truth)  
4. Decision Log  
5. Risk Register  
6. Master Plan (this file — roadmap)

| Tầng | Vai trò | Ví dụ |
|---|---|---|
| **Legacy Sources** | Input phân tích (không phải SoT runtime đích) | Frontend A/B (frozen), Supabase A/B, dumps, migrations |
| **Merge Specification** | **SoT thiết kế hợp nhất / Business Truth** (Phase 3) | Mapping schema/rules/auth/data + FE Contract matrix |
| **Unified Domain Model** | SoT nghiệp vụ / Architecture Truth | Bounded contexts, use-cases |
| **Unified Backend** | SoT runtime ứng dụng | Express modules / services — **khớp FE Contract** |
| **Unified Database** | SoT persistence đích (derived from Business/Domain) | PostgreSQL DDL + constraints |

**Frontend Frozen:** FE trong workspace = Contract; Backend phải tương thích FE — không ngược lại.  
**Supabase = Legacy Source only** sau khi Backend lên.  
**Database ≠ Business SoT.** Schema thiết kế từ Business → Domain → Database.

Tài liệu RE trong `migration-analysis/` = **Legacy Analysis**. Xem `migration-analysis/README.md`.

---

## Trạng thái hiện tại

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Phase 0–2 | ✅ Technical work complete (System đã RE trong workspace) | **Giữ nguyên kết quả lịch sử**; diễn giải lại dưới hướng Consolidation |
| Phase 2 Gate “Runtime = afgveikz/hzppst” | Vẫn **Waiting External Confirmation** (dữ liệu lịch sử) | Dưới mục tiêu mới: hai refs có thể là env **cùng** hệ hoặc A/B — **chưa** kết luận; Merge Spec sẽ cần định danh System A vs B chính thức |
| System B (FE B / Supabase B) | ⬜ / **DR-P3-001** | Decision Request mở — không tự bịa B |
| Phase 3+ | 🔄 Execution Mode | Pipeline bắt buộc; dừng sau mỗi Phase chờ Human |
| Backend scaffold `api-chantier/` | Partial / opportunistic | **Không** = Architecture Done; **FE Frozen** |
| Hướng tiếp theo | **Phase 3 Planner ✅** → Human trả lời DR-P3-001 → Architect | Không nhảy code trước Merge Spec |

---

## Workspace

| Thư mục | Vai trò mới |
|---|---|
| `plan/plan/` | Governance + Master Plan Consolidation |
| `migration-analysis/` | **Legacy Analysis** (+ chỗ cho Unified / Merge docs) |
| `chantier1/...` | Candidate **Frontend / Supabase legacy** (đã RE — gọi tạm **System A** cho đến khi Product đặt tên chính thức) |
| `api-chantier/` | Scaffold Backend đích (chưa implement nghiệp vụ) |

**Target stack:**

| Layer | Công nghệ |
|---|---|
| Unified Frontend | 1 app (từ hợp nhất FE A+B — design sau) |
| Unified Backend | Express.js modular (`api-chantier/`) |
| Unified DB | PostgreSQL (Compose `db`) — không PostgREST / Supabase Auth / Edge như runtime |

---

## Inventory bắt buộc từ Legacy (mỗi hệ A và B)

Mọi Trigger / Function / RPC / RLS / Edge / Auth / Storage / Realtime trong mỗi legacy phải vào **Merge Specification** (Keep in unified / Transform / Drop / A-only / B-only).

---

## Dependency graph (roadmap mới — từ Phase 3)

```
Phase 0 ✅ Legacy RE (workspace — historical)
Phase 1 ✅ Architecture validation (historical)
Phase 2 ✅ DB dump investigation (historical; Gate env còn mở)
        ↓
Phase 3  Merge Specification          ◄── SoT hợp nhất quan trọng nhất
        ↓
Phase 4  Unified Domain Discovery
        ↓
Phase 5  Unified Database Modeling
        ↓
Phase 6  Business Logic Consolidation
        ↓
Phase 7  Backend Architecture Design
        ↓
Phase 8  Migration Strategy (legacy → unified)
        ↓
Phase 9  API Contract
        ↓
Phase 10 Backend Implementation Planning
        ↓
Phase 11 Data Migration Planning
        ↓
Phase 12 Testing Strategy
        ↓
Phase 13 Deployment / Cutover Strategy
        ↓
Phase 14 Production Rollout / Hypercare
```

**Quy tắc:** không Backend Implementation (code nghiệp vụ) khi Phase 3–7 + 9 chưa đóng design. Scaffold ≠ Done.

Các folder phase cũ kiểu “P3 domain / P4 ADR migration 1:1” → đánh dấu **Superseded** (giữ lịch sử).

---

# Phases 0–2 (HISTORICAL — không làm lại / không sửa kết quả)

## Phase 0 — Reverse Engineering ✅ Completed

| | |
|---|---|
| **Status** | ✅ Completed (2026-07-14) — **Legacy Analysis** |
| **Goal (lịch sử)** | Hiểu hệ thống trong workspace trước design |
| **Outputs** | `migration-analysis/` |
| **Diễn giải mới** | Input **Legacy Source** (System đã có trong repo). Không đủ một mình để Unified Backend nếu còn System B |

## Phase 1 — Current Architecture Validation ✅ Completed

| | |
|---|---|
| **Status** | ✅ Done — Architecture Scope (workspace) Confirmed |
| **Goal (lịch sử)** | Xác nhận FE client / env / Edge / realtime trong repo |
| **Diễn giải mới** | Phạm vi **một** FE trong workspace; brief Super Admin dual-DB **không** có trong code. Mục tiêu Consolidation **bổ sung** System B từ ngoài Phase 1 |

## Phase 2 — Database Reverse Engineering Validation

| | |
|---|---|
| **Status** | **Technical Investigation Complete** · **Waiting External Confirmation** |
| **Goal (lịch sử)** | Dump + diff schema project reachable (`hzppst`) vs migrations |
| **Outputs** | `production-dump/`, `production-vs-repository-diff.md`, `SOURCE_OF_TRUTH_DECISION.md` |
| **Diễn giải mới** | Verified Dump = **Legacy DB evidence**, không tự động = Unified DB. External Confirmation vẫn hữu ích để map project refs → System A/B hoặc env variants |

---

# Phases 3–14 (ROADMAP MỚI)

## Phase 3 — Merge Specification

| | |
|---|---|
| **Status** | ⬜ Todo — **NEXT** (when Legacy A+B inputs ready) |
| **Goal** | Tạo **Merge Specification** = SoT hợp nhất để thiết kế Backend |
| **Inputs** | Legacy Analysis A (`migration-analysis/`); Legacy Analysis B (cần identify & ingest); Product naming A/B; dumps nếu có |
| **Outputs** | `merge-specification/` (hoặc `migration-analysis/merge/`) đầy đủ mapping |
| **Dependencies** | Phase 0–2 historical OK; **Gate:** Legacy B identified (path/repo/dump) hoặc Decision Log “B = deferred / same-as-A” |
| **Deliverables** | Mapping: schemas, tables, rules, triggers, functions, RPC, Edge, auth, permissions, storage, realtime, data merge / A-only / B-only |
| **Acceptance Criteria** | Mọi object class ở trên có hàng mapping + quyết định Transform/Drop/A-only/B-only; conflicts liệt kê; Product sign-off |
| **Exit Criteria** | Merge Spec approved; Decision Log; không còn “assume clone single Supabase” |
| **Required Evidence** | Merge Spec doc set + conflict register |
| **Risks** | System B thiếu; nhầm 2 project refs thành 2 products; conflict rules không resolve |
| **Tasks (gợi ý)** | P3-T01 Identify A/B · P3-T02 Schema map · P3-T03 Rules/triggers/functions map · P3-T04 AuthZ/auth map · P3-T05 Edge/realtime/storage map · P3-T06 Data merge map · P3-T07 Conflict decisions |

Folder: `phases/phase_03_merge_specification/`

---

## Phase 4 — Unified Domain Discovery

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Domain thống nhất độc lập Supabase; use-cases từ Merge Spec |
| **Inputs** | Merge Spec approved; Legacy business-flows A/B |
| **Outputs** | Unified glossary, bounded contexts, use-case catalog, state machines |
| **Dependencies** | Phase 3 |
| **Deliverables** | Domain pack under `migration-analysis/unified/` hoặc `plan/.../domain/` |
| **Acceptance Criteria** | Mỗi conflict rule từ Merge Spec có owner use-case hoặc Drop; Flow greenfield ghi Decision Log |
| **Exit Criteria** | Domain signed-off; no Entity/API code |
| **Required Evidence** | Glossary + use-case list + decision rows |
| **Risks** | Domain nghiêng về A; bỏ B-only capabilities |

Folder: `phases/phase_04_unified_domain_discovery/`

---

## Phase 5 — Unified Database Modeling

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Target PostgreSQL unified schema (DDL plan) từ Merge Spec + Domain |
| **Inputs** | Phase 3–4; Legacy schemas A/B |
| **Outputs** | Unified ER + DDL plan + rename/merge table dictionary |
| **Dependencies** | Phase 3–4 |
| **Deliverables** | Target schema design docs (not necessarily applied migrations yet) |
| **Acceptance Criteria** | Mọi bảng mapped có chỗ trong target hoặc Drop; FK/unique/check strategy; tenancy strategy |
| **Exit Criteria** | Schema design approved; rollback notes for future apply |
| **Required Evidence** | DDL plan + mapping table IDs |
| **Risks** | Losing A-only/B-only columns; ambiguous PKs/identity merge |

Folder: `phases/phase_05_unified_database_modeling/`

---

## Phase 6 — Business Logic Consolidation

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Hợp nhất triggers/functions/RPC/Edge/FE orchestration → **một** catalog logic (Keep-in-DB constraints vs Port-to-BE) |
| **Inputs** | Merge Spec logic maps; Phase 4–5 |
| **Outputs** | Consolidated logic inventory + service responsibility matrix |
| **Dependencies** | Phase 3–5 |
| **Deliverables** | Decision table Transform→Backend Service / Keep SQL / Drop |
| **Acceptance Criteria** | Không còn logic “dual-write FE+trigger+Edge” không owner; sync/validate/export có single write-path design |
| **Exit Criteria** | Signed Keep/Port/Drop for A∪B inventories |
| **Required Evidence** | Inventory matrix + conflict resolutions |
| **Risks** | Trigger conflicts A vs B; silent Drop |

Folder: `phases/phase_06_business_logic_consolidation/`

---

## Phase 7 — Backend Architecture Design

| | |
|---|---|
| **Status** | ⬜ Todo (scaffold Partial only) |
| **Goal** | ADR Unified Backend Express modular + Postgres — **thay** Supabase runtime |
| **Inputs** | Phase 4–6; `api-chantier/` scaffold |
| **Outputs** | ADR: modules, authn/z placement, error model, migration runner, realtime/storage strategy |
| **Dependencies** | Phase 6 (logic owners); Phase 5 (schema targets) |
| **Deliverables** | ADR + module map covering Auth, AuthZ, all Ported services |
| **Acceptance Criteria** | ADR approved; mọi Port item Phase 6 có module; Compose canonical; scaffold ≠ Done without ADR |
| **Exit Criteria** | ADR signed; observability/rollback hooks designed |
| **Required Evidence** | ADR path + decision_log |
| **Risks** | Copying PostgREST shapes; skipping AuthZ |

Folder: `phases/phase_07_backend_architecture_design/`

---

## Phase 8 — Migration Strategy

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Chiến lược cắt legacy A/B → unified BE/DB (dual-run, freeze, rollback) |
| **Inputs** | Phase 5–7; Legacy dumps |
| **Outputs** | Cutover-oriented migration playbook (schema apply order, trigger disable, Edge deprecate) |
| **Dependencies** | Phase 5–7 |
| **Deliverables** | Runbook + RTO/RPO notes |
| **Acceptance Criteria** | Safe order documented; rollback per step; no assume 1:1 table copy without Merge Spec |
| **Exit Criteria** | Playbook approved |
| **Required Evidence** | Playbook + risk sign-off |
| **Risks** | Dual legacy cutover complexity |

Folder: `phases/phase_08_migration_strategy/`

---

## Phase 9 — API Contract

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | HTTP/API contracts cho Unified Frontend → Unified Backend |
| **Inputs** | Phase 4 use-cases; Phase 6–7; Legacy FE call inventories A/B |
| **Outputs** | OpenAPI / contract pack (design); versioning; error model alignment |
| **Dependencies** | Phase 7 ADR |
| **Deliverables** | Contract docs per module |
| **Acceptance Criteria** | Flows unified có endpoints; auth headers/JWT defined; no Supabase client assumed in contract |
| **Exit Criteria** | Contracts approved for implementation planning |
| **Required Evidence** | OpenAPI/contract files |
| **Risks** | Leaking PostgREST semantics; FE A/B incompatible payloads |

Folder: `phases/phase_09_api_contract/`

---

## Phase 10 — Backend Implementation Planning

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Kế hoạch implement (milestones, module order, test hooks) — **không** = Implementation Done |
| **Inputs** | Phase 7–9 |
| **Outputs** | Implementation backlog / sprint plan / Definition of Done per module |
| **Dependencies** | Phase 9 |
| **Deliverables** | Plan docs + task breakdown under `phases/phase_10_*/` |
| **Acceptance Criteria** | Mọi contract có task implement; security review points listed; dual-run hooks noted |
| **Exit Criteria** | Plan approved to start coding (later execution wave) |
| **Required Evidence** | Plan + traced contracts |
| **Risks** | Starting code before plan; scope creep |

Folder: `phases/phase_10_backend_implementation_planning/`

---

## Phase 11 — Data Migration Planning

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | ETL/merge plan từ Legacy A+B data → Unified DB |
| **Inputs** | Merge Spec data maps; Phase 5 schema; Phase 8 strategy |
| **Outputs** | ETL design, identity merge rules, reconcile checks, dry-run plan |
| **Dependencies** | Phase 5, 8; Phase 3 data section |
| **Deliverables** | Data migration plan (scripts later) |
| **Acceptance Criteria** | Duplicate identity rules; FK resolve; A-only/B-only data handled; rollback |
| **Exit Criteria** | Plan approved |
| **Required Evidence** | Plan + sample reconcile design |
| **Risks** | Duplicate users; orphan FKs; irreversible merges |

Folder: `phases/phase_11_data_migration_planning/`

---

## Phase 12 — Testing Strategy

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Chiến lược test hợp nhất (unit/integration/E2E/security) trước cutover |
| **Inputs** | Unified domain; API contracts; authZ; merge conflicts |
| **Outputs** | Test plan + coverage gates |
| **Dependencies** | Phase 9–11 (plans); implementation waves later |
| **Deliverables** | Testing strategy doc |
| **Acceptance Criteria** | Conflict cases covered; dual-legacy regression; no Critical open gate defined |
| **Exit Criteria** | Strategy approved |
| **Required Evidence** | Test plan |
| **Risks** | Testing only System A behaviors |

Folder: `phases/phase_12_testing_strategy/`

---

## Phase 13 — Deployment / Cutover Strategy

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Deploy Unified FE/BE/DB; tắt write path Supabase A/B |
| **Inputs** | Phase 8, 12; rollback |
| **Outputs** | Deployment + cutover runbooks |
| **Dependencies** | Phase 8, 12 |
| **Deliverables** | Runbooks |
| **Acceptance Criteria** | Dual cutover sequenced; freeze windows; Edge/Auth deprecate plan |
| **Exit Criteria** | Runbooks approved |
| **Required Evidence** | Runbooks + communications plan |
| **Risks** | Split-brain A/B during cutover |

Folder: `phases/phase_13_deployment_strategy/`

---

## Phase 14 — Production Rollout / Hypercare

| | |
|---|---|
| **Status** | ⬜ Todo |
| **Goal** | Ổn định production unified; monitor; hypercare |
| **Inputs** | Cutover executed |
| **Outputs** | Ops runbook; alerts; postmortem checklist |
| **Dependencies** | Phase 13 |
| **Deliverables** | Hypercare pack |
| **Acceptance Criteria** | KPIs stable; rollback unused; SoT “as consolidated” |
| **Exit Criteria** | Hypercare exit criteria met |
| **Required Evidence** | Metrics + incident log |
| **Risks** | Silent merge bugs; export/auth regressions |

Folder: `phases/phase_14_production_rollout/`

---

## Status board mapping

| Phase | Status |
|---|---|
| 0–1 | ✅ Done (Legacy / historical) |
| 2 | Technical Investigation Complete · Waiting External Confirmation (historical Gate) |
| 3 Merge Specification | ⬜ Todo **(next design track)** |
| 4–14 | ⬜ Todo (new Consolidation roadmap) |
| Old P3–P5 migration-1:1 prep folders | 🗂️ Superseded (kept) |

---

## Migration Checklist (reoriented)

### Consolidation
- [ ] Legacy A catalog complete
- [ ] Legacy B catalog complete (or Decision Log defer)
- [ ] Merge Specification approved
- [ ] Unified domain + schema + logic signed

### Backend replaces Supabase
- [ ] Auth/AuthZ/RPC/Triggers/Edge/Business/RLS/Storage/Realtime decisions in Merge Spec + Phase 6–7
- [ ] API contracts without Supabase client assumptions
- [ ] Implementation plan
- [ ] Data merge plan A+B

### Cutover
- [ ] Dual-run then disable Supabase writes
- [ ] Rollback tested

---

## Ghi chú vận hành

1. Phase 0–2 **không làm lại** trừ bổ sung Legacy B RE (phase/task riêng nếu cần).  
2. Không clone Supabase — **thiết kế hệ thống mới** từ Merge Spec.  
3. `api-chantier/` scaffold ≠ Unified Backend Done.  
4. Docs lịch sử (`SOURCE_OF_TRUTH_DECISION` runtime afg/hz, NEXT_ACTION_MATRIX, …) **giữ**; thêm addendum Consolidation.  
5. Báo cáo refactor: `AGENTIC_FLOW_REFACTOR_REPORT.md`.
