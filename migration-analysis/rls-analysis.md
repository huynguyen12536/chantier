# Phân tích RLS Policy (tiếng Việt)

**Nguồn lịch sử:** SQL migrations (helpers `is_admin`, `is_zone_owner`, `get_chef_chantier_ids`).  
**Nguồn live (Phase 2):** dump `hzppst` (~61 policies) + `get_my_role`. Diff: `production-vs-repository-diff.md`.

**Không** copy nguyên SQL — giải thích quyền.

---

## Phase 2 production notes

1. RLS **ON** mọi bảng public nghiệp vụ (verified).
2. Profiles admin INSERT/UPDATE trên prod dùng **`get_my_role() = 'admin'`** (không chỉ `is_admin()`).
3. **Bug:** `"Admin can insert zone ouvriers"` khai báo **`FOR SELECT`** trên prod.
4. Inventory đầy đủ: `production-dump/03_inventory.txt`.

---

## Nguyên tắc chung

- Policies `TO authenticated` — anonymous không đọc/ghi data app.
- Nhiều policy cùng command được **OR** (permissive).
- **Không có** `company_id()` / multi-tenant column — toàn DB = 1 công ty.
- Phụ thuộc chính: **`auth.uid()`** so với `profiles.role` hoặc ownership rows.

---

## Helpers phụ thuộc

| Helper | On hzppst? | Phụ thuộc `auth.uid()`? | company_id? | site_id? |
|--------|------------|-------------------------|-------------|----------|
| `is_admin()` | Yes | Có | Không | Không |
| `is_zone_owner(zone)` | Yes | Có | Không | Không |
| `get_chef_chantier_ids(uid)` | Yes | Truyền uid | Không | Trả về list site |
| `get_my_role()` | Yes (không có trong migrations repo) | Có | Không | Không |

Không tồn tại hàm `company_id()` hay `site_id()` trong schema.

---

## `profiles`

| Ai được đọc | Ai được ghi (INSERT) | Ai được UPDATE | Ai bị chặn |
|-------------|----------------------|----------------|------------|
| Chính mình; **mọi user authenticated đọc được mọi profile** | Admin qua `get_my_role()='admin'` (**prod**) | Chính mình; admin qua `get_my_role()` | Ouvrier/chef không sửa user khác; non-admin không insert |

**Ý nghĩa:** danh sách user cho management/assign hoạt động; đánh đổi privacy trong multi-user cùng DB.

---

## `chantiers`

| Đọc | Ghi | Update | Chặn |
|-----|-----|--------|------|
| Mọi authenticated (`USING true` — **không** filter `actif` dù tên policy nói “active”) | admin **hoặc** administratif | admin **hoặc** administratif | chef/ouvrier không tạo/sửa; **không ai DELETE qua RLS** (phải RPC) |

- Phụ thuộc role lookup trên `profiles` bằng `auth.uid()`  
- Không company/site helper  

---

## `affectations_chantiers`

| Đọc | Insert/Update | Delete |
|-----|---------------|--------|
| Own rows; chef qua nhiều lớp (chef_equipe_id / supervised chantier / `get_chef_chantier_ids`); admin/administratif all | admin, administratif, **chef_equipe** | Không có policy DELETE tường minh — dùng soft `date_fin` từ FE |

Ai bị chặn đọc: ouvrier chỉ thấy **của mình** (trừ khi policy khác mở — currently own).

---

## `periodes_travail`

| Thao tác | Ai được | Điều kiện chính |
|----------|---------|-----------------|
| SELECT | Own; chef (chantier managed / zone / supervised); admin/administ. | |
| INSERT | Own (`user_id = auth.uid()`) | Không tạo hộ người khác |
| UPDATE | Own nếu en_cours/terminee; own rejetee→terminee (resubmit); chef validate; admin | |
| DELETE | Own non-validated / rejected; chef team; admin | Không xóa tùy tiện période đã validate (trừ chef/admin policies) |

- Mạnh phụ thuộc `auth.uid()`  
- Scope site qua `get_chef_chantier_ids` / joins zone  

---

## `declarations_heures`

Tương tự periods nhưng:

- User chỉ update draft `brouillon`
- Chef update khi `soumise`/`validee` (validation path)
- Admin full update
- Delete: own draft/rejected; chef/admin theo policy cancel

Triggers DEFINER ghi bảng này **bypass RLS** khi sync từ periods.

---

## `zones_equipe`

| Role | Quyền |
|------|--------|
| Chef | CRUD zones **của mình** (`chef_equipe_id = auth.uid()`) |
| Ouvrier | SELECT zones mình đang được gán (active) |
| Admin (`is_admin`) | Full CRUD mọi zone |
| Administratif | **Không** qua `is_admin()` — thường bị chặn zone admin policies |

---

## `zones_chantiers` / `zones_ouvriers`

| Role | Quyền |
|------|--------|
| Chef owner (`is_zone_owner`) | Quản lý members/sites của zone |
| Ouvrier | Đọc assignment của mình / chantiers trong zone được gán |
| Admin | Full |
| Không có UPDATE trên `zones_chantiers` | Unlink = DELETE |

---

## Edge Functions & RLS

`create-user` / `delete-user` dùng **service role** → bỏ RLS. Bảo mật = kiểm tra role caller trong code Deno, không phải policy SQL.

---

## Rủi ro RLS đáng chú ý khi migrate

1. **Profiles SELECT mở** — mọi user đọc PII đồng nghiệp.  
2. **Chantiers SELECT mở** — mọi site hiện ra.  
3. **Logic chef phức tạp / trùng** (zones + supervised + get_chef_chantier_ids) — khó port 1-1 sang backend.  
4. **SECURITY DEFINER triggers** — phải replicate đúng nếu bỏ RLS-centric model.  
5. Wave B có thể **trùng policy names** nếu apply chồng — Phase 2 dump: ~61 policies live; tracking migrations chỉ 5 rows (không tin version vector).  
6. Zone chef FK **CASCADE** trên prod vs RESTRICT trong migration sau — ảnh hưởng delete-user assumptions.
