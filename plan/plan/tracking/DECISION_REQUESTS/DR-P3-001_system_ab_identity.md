# Decision Request — DR-P3-001 — RESOLVED

**Status:** ✅ Resolved — **O3**  
**Resolved by:** Technical Lead Decision  
**Date resolved:** 2026-07-14  
**Phase:** 3 — Merge Specification

---

## Decision (authoritative)

**O3 — Continue Phase 3 with Current Verified Legacy.**

- Phase 3 **không** blocked.  
- Không chờ thêm repository.  
- Không pause project.  
- Tiếp tục Agentic Flow.

### Terminology (replace System A/B)

| Cũ (không dùng từ Phase 3+) | Mới |
|---|---|
| System A | **Current Verified Legacy** |
| System B | **Pending Legacy Discovery** |
| Unified product | **Unified Platform** |

### Scope interpretation

| Concept | Meaning |
|---|---|
| Current Workspace | = Current Verified Legacy — **không** = Final Product |
| `migration-analysis/` | Current Verified Legacy Source — **không** = Final Business Truth |
| Pending Legacy Discovery | Legacy thứ hai chưa có đủ evidence RE — merge sau bằng Merge Decision |
| Design rule | **Open for Future Legacy Merge** — không hardcode “chỉ một legacy” |

### Constraints locked

- Không tạo / sửa / bỏ Business Rule của Current Verified Legacy trong `migration-analysis/`.  
- Khác biệt với Pending Legacy sau này → Merge Decision — không rewrite Legacy docs.  
- Frontend Frozen = Contract; Backend adapts.  
- afgveikz / hzppst = candidate **env / drift** của Current Verified Legacy product (chưa promote Production SoT) — xem Phase 2 Track L.

See Decision Log 2026-07-14 (O3) and Merge Spec pack under `migration-analysis/merge/`.
