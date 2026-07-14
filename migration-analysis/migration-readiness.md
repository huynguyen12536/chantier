# Migration Readiness

**Nguồn:** Tổng hợp Frontend + Migrations + Edge + Triggers.

---

## 1. Business logic đang nằm trong Trigger

| Logic | Trigger / Effect |
|-------|------------------|
| Tạo/cập nhật tổng hợp ngày từ ca | `trigger_sync_declarations` |
| Soft-cancel declaration khi hết periods | cùng function |
| Lan validate/reject xuống periods | `trigger_sync_periods_from_declaration` |
| Auto-approve ca lặp | `trigger_auto_approve_matching_latest_validated_shift` |

**Rủi ro nếu bỏ trigger mà không viết lại backend:** declarations không còn sinh; validation không sync; mất auto-approve.

---

## 2. Business logic đang nằm trong Function (RPC / helper)

| Function | Giữ DB? / Chuyển BE? |
|----------|----------------------|
| `delete_chantier_cascade` | Nên **Backend service** (transaction rõ, audit) — hiện DEFINER RPC |
| `calculer_heures_cadre_chantier` + view | Có thể giữ DB **hoặc** port BE payroll engine — phải 1 nguồn truth |
| `auto_approve_week_suggestion_replication` | FE đã tắt — quyết định product rồi port BE hoặc bỏ |
| `is_admin` / `is_zone_owner` / `get_chef_chantier_ids` | Thay bằng authZ middleware / policies BE |

---

## 3. Business logic đang nằm trong Frontend

| Logic | File / khu vực |
|-------|----------------|
| RBAC tabs / routes | `utils/role.ts`, layouts |
| Scope worksites ouvrier/chef | `AuthContext`, `utils/team.ts` |
| Sinh mã chantier | `utils/worksiteCode.ts` |
| Suggestion / replicate tuần | `utils/ouvrierDeclaration.ts` |
| Format export paie | `utils/export*`, `payroll.ts` |
| Promote chef + chặn demotion | `management.tsx` |
| GPS gắn lúc declare | declare screens + `useLocation` |
| Gọi Edge create/delete user | management / admin-users |
| Dual update periods khi validate | `validation.tsx` (trùng trigger) |

Frontend đang là **orchestration + rules trùng DB** — cần làm sạch khi có Backend.

---

## 4. Logic nên chuyển sang Backend

1. User provisioning (thay Edge / hoặc giữ Edge nhưng chuẩn hóa).  
2. CRUD company-scoped entities với authZ tập trung.  
3. Declare / validate / cancel **use-cases** (thay trigger side-effects bằng service + events).  
4. Payroll export (hiện FE-only aggregation).  
5. Auto-approve rules (testable, auditable, set `validated_by`).  
6. **Super Admin / multi-company** (greenfield — chưa có).  
7. Cascade delete site với soft-delete/audit thay hard delete DEFINER.

---

## 5. Logic nên giữ ở Database

| Giữ | Lý do |
|-----|-------|
| FK + UNIQUE + CHECK constraints | Integrity cuối cùng |
| Partial indexes | Perf |
| (Tuỳ chọn) generated columns / view báo cáo read-model | Nếu BE không materialize |
| RLS **nếu** vẫn expose PostgREST trực tiếp | Defense in depth |

Nếu Backend là **only writer** (service role): có thể giảm RLS phức tạp → row-level trong app + DB constraints.

---

## 6. Logic nên bỏ / đơn giản hóa

| Mục | Lý do |
|-----|-------|
| Service classes FE không dùng | Dead code |
| Validate ở cả FE periods + declaration + 2 triggers | Chọn **một** write path |
| RPC week auto-approve nếu product không dùng | Xóa hoặc wire lại có chủ đích |
| Open SELECT all profiles/chantiers | Thắt lại khi multi-tenant |
| Wave migration trùng | Chuẩn hóa schema từ dump production, không replay cả A+B |
| Hardcode anon key trong `app.config.js` | Chuyển secret management |

---

## 7. Checklist trước khi code Backend mới

- [ ] Dump schema production thật (CLI) — đối chiếu `database-schema.md`
- [ ] Xác nhận hai project `afgveikz…` vs `hzppst…` (dev/prod?)
- [ ] Product quyết định: giữ DB-per-company hay schema-per-tenant
- [ ] Catalogue business rules (xem SUMMARY) được sign-off
- [ ] Chiến lược thay triggers: feature flag / dual-run
