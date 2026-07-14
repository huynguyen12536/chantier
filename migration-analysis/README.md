# migration-analysis — Mục lục & phân loại

Phân tích reverse-engineer legacy Chantier / Supabase.  
**Chỉ tài liệu** — không đụng source app.

> **Project direction (2026-07-14):** Consolidation + Replatforming (2 FE × 2 Supabase → 1 FE + 1 BE + 1 PG).  
> Tài liệu dưới đây chủ yếu là **Legacy Analysis** của hệ thống đã có trong workspace (gọi tạm **System A** cho đến khi Product đặt tên).  
> **Không** còn là Source of Truth runtime đích. SoT thiết kế hợp nhất = **Merge Specification** (Phase 3).

---

## Phân loại tài liệu

| Tag | Ý nghĩa |
|---|---|
| **Legacy Analysis** | Mô tả một hệ cũ (hiện: workspace RE) |
| **Merge Analysis** | Mapping A↔B / conflicts (Phase 3 — chưa có đủ pack) |
| **Unified Analysis** | Domain/schema/logic thống nhất sau Merge Spec (Phase 4+) |

| Document | Tag |
|---|---|
| `00-IMPORTANT-FINDINGS.md` | Legacy |
| `frontend-*.md`, `tables-used-by-frontend.md` | Legacy |
| `database-schema.md`, `entity-relationship.md` | Legacy (+ dump notes) |
| `functions/`, `triggers/`, `rls-analysis.md`, `auth-flow.md` | Legacy |
| `business-flows.md`, `diagrams/` | Legacy |
| `migration-readiness.md`, `SUMMARY.md` | Legacy (pre-consolidation wording may remain — interpret as Legacy input) |
| `production-dump/`, `production-vs-repository-diff.md` | Legacy evidence (Verified Dump) |
| `SOURCE_OF_TRUTH_DECISION.md` | Legacy env gate (**addendum** Consolidation) |
| `CONFIDENCE_MATRIX.md` | Legacy investigation confidence |
| `merge/` (to create in Phase 3) | **Merge Analysis** |
| `unified/` (to create in Phase 4+) | **Unified Analysis** |

---

## Mục lục Legacy (Phase 0)

1. Bắt buộc đọc: [00-IMPORTANT-FINDINGS.md](./00-IMPORTANT-FINDINGS.md)
2. [frontend-overview.md](./frontend-overview.md)
3. [frontend-supabase-usage.md](./frontend-supabase-usage.md)
4. [tables-used-by-frontend.md](./tables-used-by-frontend.md)
5. [entity-relationship.md](./entity-relationship.md)
6. [database-schema.md](./database-schema.md)
7. [functions/](./functions/)
8. [triggers/](./triggers/)
9. [rls-analysis.md](./rls-analysis.md)
10. [auth-flow.md](./auth-flow.md)
11. [business-flows.md](./business-flows.md)
12. [diagrams/](./diagrams/)
13. [migration-readiness.md](./migration-readiness.md)
14. [SUMMARY.md](./SUMMARY.md)
15. [SOURCE_OF_TRUTH_DECISION.md](./SOURCE_OF_TRUTH_DECISION.md) + Consolidation addendum
16. [CONFIDENCE_MATRIX.md](./CONFIDENCE_MATRIX.md)
