# SUMMARY — Reverse Engineer Supabase Chantier

**Ngày:** 2026-07-14  
**Phạm vi:** Repo `chantier1/Chantier-web-app-main` (Frontend Expo + migrations + Edge).  
**Không** sửa code / không commit.

Đọc trước: [`00-IMPORTANT-FINDINGS.md`](./00-IMPORTANT-FINDINGS.md).

---

## 1. Hệ thống hiện tại hoạt động như thế nào?

Đây là ứng dụng **BTP timesheet** single-tenant trên **một** Supabase project:

- User đăng nhập Supabase Auth → đọc `profiles.role`.
- **Admin / Administratif** quản lý users (Edge), chantiers, affectations.
- **Chef d’équipe** quản lý zones, validate giờ.
- **Ouvrier** khai báo `periodes_travail` (GPS, panier, déplacement).
- DB **tự tổng hợp** thành `declarations_heures` bằng trigger; có thể auto-validate ca lặp.
- **Administratif/Chef/Admin** export dữ liệu đã validate.

Frontend gọi PostgREST trực tiếp + realtime + 2 Edge Functions. Không có repository pattern thật sự.

---

## 2. Hai database liên kết logic với nhau ra sao?

**Trong source hiện tại: không có liên kết Super Admin DB ↔ Company DB.**

Chỉ thấy:

| Project ref | Vai trò quan sát được |
|-------------|----------------------|
| `afgveikzneaablcuzwdb` | Runtime app config |
| `hzppsttpzzeuslnpcdkv` | CLI linked project “CHANTIER” |

→ Nhiều khả năng **hai môi trường**, không phải dual-DB kiến trúc brief.

**Liên kết logic nếu thiết kế đích (chưa code):** DB A giữ registry Company + credentials/Admin bootstrap; DB B chứa schema BTP như hiện tại. Cần implement ngoài repo này.

---

## 3. Luồng dữ liệu end-to-end

```
Auth.users ↔ profiles
Admin → Edge create-user → profiles
Admin → chantiers + affectations (+ zones_*)
Ouvrier → periodes_travail
         → (trigger) declarations_heures
         → (optional auto-approve) validee
Chef → UPDATE declarations / periods
Administratif → SELECT periods → export file (FE)
Realtime: FE lắng nghe periods/declarations
```

Chi tiết: `business-flows.md`, `diagrams/`.

---

## 4. Điểm cần đặc biệt lưu ý khi migrate

1. **Triggers là xương sống** sync periods ↔ declarations — bỏ là gãy nghiệp vụ.  
2. **SECURITY DEFINER** bypass RLS — BE phải replicate đúng authZ.  
3. **Hours math** phụ thuộc `chantiers.heure_*` + fallback 7h.  
4. **`nb_deplacements`** có trên bảng/view nhưng sync function cuối **không ghi** khi upsert — có thể data drift.  
5. Auto-approve **không set `validated_by`**.  
6. Migration wave A+B — đừng assume linear apply; **tin dump production**.  
7. Profiles/Chantiers RLS rất mở — không đủ cho multi-company.  
8. Anon key hardcode trong repo.  
9. Brief Super Admin **chưa có** — ước lượng effort riêng.

---

## 5. Danh sách business rules (cốt lõi)

1. Role ∈ {ouvrier, chef_equipe, administratif, admin}.  
2. Chỉ admin/administratif tạo user (Edge); chỉ admin xóa user.  
3. Không tự xóa / không xóa nếu còn zone chef (RESTRICT).  
4. Unique assign `(user, chantier)`; soft end bằng `date_fin`.  
5. Unique declaration `(user, chantier, date)`.  
6. Periods: fin null ↔ `en_cours`; nhiều periods/ngày được.  
7. Declaration sinh từ periods; `soumise` → có thể `annulee` khi hết periods.  
8. Validate/reject declaration lan sang periods `terminee|en_cours`.  
9. Auto-approve nếu 1 period khớp exact ca validee gần nhất.  
10. Cadre chantier tách normale/HS; không cadre → 7h.  
11. Chef thấy/duyệt theo assignment / zone / supervised / `get_chef_chantier_ids`.  
12. Ouvrier thấy site qua affectation ∪ zone.  
13. Xóa chantier = cascade RPC (periods→declarations→zones_chantiers→affectations→chantier).  
14. Export chỉ (thường) dữ liệu đã validate phía UI.  
15. Resubmit period `rejetee` → `terminee` dưới RLS.

---

## 6. Phần bắt buộc viết lại trong Backend

- AuthZ multi-role (+ tương lai multi-company).  
- User lifecycle (create/delete/promote) thay Edge ad-hoc.  
- Declare / edit / delete timesheet use-cases.  
- Validate / reject / cancel orchestration (thay dual FE+trigger).  
- Auto-approve policy engine.  
- Cascade delete / soft-delete strategy.  
- Export/payroll API.  
- **Platform Super Admin & provisioning** (nếu theo brief).

---

## 7. Phần chỉ cần migrate schema

- Tables + FK + UNIQUE + CHECK.  
- Indexes.  
- View `synthese_heures_journalieres` (hoặc materialize ở BE).  
- Pure calc functions (`minutes_from_time`, `calculer_heures_cadre_chantier`, `calculer_duree_periode`) nếu vẫn muốn SQL-side reporting.

---

## 8. Nguy cơ nếu bỏ Trigger

| Bỏ trigger | Hậu quả |
|------------|---------|
| `trigger_sync_declarations` | Không còn declaration; validation UI trống; export dựa declaration gãy |
| `trigger_sync_periods_from_declaration` | Periods lệch statut so với declaration; realtime chef sai |
| Auto-approve trigger | Mọi ca lặp phải duyệt tay (có thể OK nếu product muốn) nhưng đổi SLA |

**Mitigation:** port từng rule sang service transaction; dual-write hoặc backfill declarations trước cutover.

---

## 9. Thứ tự migrate an toàn nhất

1. **Freeze & dump** production schema/data (cả 2 project refs nếu còn sống).  
2. Document diff dump vs `migration-analysis/`.  
3. Quyết định tenancy (DB-per-company vs shared).  
4. Migrate **schema constraints + read models** trước.  
5. Dựng Backend API song song; FE dual-run feature flag.  
6. Port **write paths** (declare) kèm parity test vs triggers.  
7. Port validation/cancel/auto-approve.  
8. Port user/site management; thay Edge.  
9. Tắt triggers khi parity đạt.  
10. Cuối: xây lớp Super Admin / registry nếu cần.  
11. Cắt PostgREST anon từ FE (chỉ gọi Backend).

---

## Chỉ mục tài liệu

| File | Bước |
|------|------|
| `00-IMPORTANT-FINDINGS.md` | Gap brief vs code |
| `frontend-overview.md` | 1 |
| `frontend-supabase-usage.md` | 2 |
| `tables-used-by-frontend.md` | 3 |
| `entity-relationship.md` | 4 |
| `database-schema.md` | 5 |
| `functions/*` | 6 |
| `triggers/*` | 7 |
| `rls-analysis.md` | 8 |
| `auth-flow.md` | 9 |
| `business-flows.md` | 10 |
| `diagrams/*` | 11 |
| `migration-readiness.md` | 12 |
| `SUMMARY.md` | 13 (file này) |

---

## Việc bạn nên làm tiếp

Chạy dump CLI trên project production thật rồi báo để cập nhật bước 5–8 theo schema sống (đặc biệt policy/function body cuối). Cho đến lúc đó, tài liệu này là **source of truth từ repo migrations + FE**.
