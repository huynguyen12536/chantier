# Decision Request — DR-P3-001

**Status:** ⏳ Waiting Human  
**Phase:** 3 — Merge Specification  
**Raised by:** Planner Agent (Execution Mode)  
**Date:** 2026-07-14  
**Blocks:** Architect / Developer work that assumes two legacy product systems

---

## Context

Execution Manual yêu cầu Consolidation (2 Frontend legacy → 1 FE frozen + 1 Backend + 1 PG) và bắt đầu Phase 3 Merge Specification.

Workspace hiện chỉ có **một** FE reverse-engineer đầy đủ (`chantier1/...`) + evidence Supabase refs `afgveikz` / `hzppst` (Phase 1–2: **không** chứng minh hai product systems; có thể là env variants).

Merge Spec Level-1 SoT **chưa tồn tại**. Hard Gate cũ: Legacy B identified **or** Decision Log exception.

Frontend = **FROZEN** — không được sửa FE để “tạo” hệ B.

---

## Evidence

- `migration-analysis/` = Legacy Analysis (một hệ / candidate A)  
- `00-IMPORTANT-FINDINGS.md` / Phase 1: single Supabase client; no second FE app in workspace  
- `SOURCE_OF_TRUTH_DECISION.md`: Runtime `afgveikz` vs Dump `hzppst` unproven as prod vs alternate  
- Master Plan / Phase 3 PHASE.md: System B TBD  
- `AGENTIC_EXECUTION_MANUAL.md`: SoT Level 1 = Merge Spec; không tự quyết khi thiếu thông tin  

---

## Options

| ID | Option | Meaning |
|---|---|---|
| **O1** | **Two products** | Human cung cấp path/repo/dump Frontend B + Supabase B; Planner ingest rồi map A↔B |
| **O2** | **Single product / B deferred** | Chỉ một hệ legacy trong scope Execution; Merge Spec = “A ∪ (env variants)” + Decision: B out of scope until later |
| **O3** | **Two envs, one product** | afgveikz + hzppst = môi trường cùng product; Merge Spec map **env drift** (không phải 2 business systems) rồi Unified Backend từ **một** FE Contract (frozen) |
| **O4** | **Pause Phase 3** | Giữ Execution Mode nhưng không chạy Architect/Developer Merge Spec đến khi O1/O2/O3 chọn |

---

## Recommendation

**O3** nếu Human xác nhận hai refs chỉ là env/drift của **cùng** product + FE hiện tại là Contract duy nhất.  
**O1** nếu thực sự có FE B / Supabase B product riêng (cần artifacts).  
**Không** khuyến nghị tự bịa System B từ dual project refs.

---

## Impact

| Choice | Impact |
|---|---|
| O1 | Phase 3 đầy đủ A↔B; delay đến khi có B inputs |
| O2 | Merge Spec “single-legacy consolidation”; giảm scope conflict A vs B; Risk R-32 accepted/deferred |
| O3 | Merge Spec tập trung env/schema drift + FE Contract compatibility matrix; Backend-First khớp FE frozen |
| O4 | Pipeline dừng ở Planner Done / Blocked |

---

## Blocked work

- Architect Agent Phase 3 (domain boundaries for merge)  
- Developer Agent artifacts under `migration-analysis/merge/` (trừ overview “waiting DR”)  
- Mọi claim “Unify A vs B business rules”  

**Không blocked:** Planner Task Breakdown (đã soạn), Documentation về Manual/status.

---

## Requested from Human

Chọn **O1 / O2 / O3 / O4** (hoặc biến thể) và nếu O1: đường dẫn artifacts System B.

Sau khi có Decision → ghi `tracking/decision_log.md` → tiếp Architect Agent Phase 3.
