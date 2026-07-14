# Tables Used by Frontend

**Nguồn:** Frontend (`.from` / Edge Functions) — không gồm bảng chỉ tồn tại trong SQL mà FE không đụng.

---

## 1. Bảng được Frontend / Edge sử dụng trực tiếp

| Bảng | Select | Insert | Update | Delete | Upsert | Realtime | Edge |
|------|:------:|:------:|:------:|:------:|:------:|:--------:|:----:|
| `profiles` | ✓ | — | ✓ | — | — | — | insert/delete qua create-user / cascade delete-user |
| `chantiers` | ✓ | ✓ | ✓ | — (qua RPC) | — | — | — |
| `affectations_chantiers` | ✓ | ✓ | ✓ | — (soft `date_fin`) | ✓ | — | — |
| `periodes_travail` | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| `declarations_heures` | ✓ | —* | ✓ | —* | — | ✓ | — |
| `zones_equipe` | ✓ | ✓ | — | ✓ | — | — | select (delete-user guard) |
| `zones_chantiers` | ✓ | ✓ | — | ✓ | — | — | — |
| `zones_ouvriers` | ✓ | ✓ | ✓ | — | — | — | — |

\* Frontend **không insert** `declarations_heures` — rows được tạo bởi **trigger** `sync_declarations_from_periods` từ `periodes_travail`. FE chủ yếu **đọc / validate / cancel**. Delete declaration chủ yếu theo policy + cancel flow (xóa periods → trigger soft-cancel).

---

## 2. Đối tượng Auth / hệ thống (không phải public table CRUD)

| Đối tượng | Cách dùng |
|-----------|-----------|
| `auth.users` | Login; tạo/xóa qua Edge `auth.admin` |
| JWT session | Bearer cho PostgREST + Edge |

---

## 3. View dùng gián tiếp (không `.from` từ FE)

| View | Ai dùng |
|------|---------|
| `synthese_heures_journalieres` | Function trigger `sync_declarations_from_periods` |

---

## 4. Bảng / notion brief nhưng **không tồn tại** trong schema FE

| Mong đợi brief | Hiện trạng |
|----------------|------------|
| `companies` / `entreprises` | Không có |
| `company_id` column | Không có |
| Super-admin users global | Không có (chỉ `admin` trong cùng DB) |

---

## 5. Mapping Site / roles

| Brief | Bảng / cột |
|-------|------------|
| Site | `chantiers` |
| Assignment Site↔User | `affectations_chantiers` |
| Team zone (nhóm giám sát) | `zones_equipe` + bridge tables |
| Timesheet line | `periodes_travail` |
| Daily timesheet summary | `declarations_heures` |
