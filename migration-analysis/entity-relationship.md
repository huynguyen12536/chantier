# Entity Relationship — Dependency Graph

**Nguồn:** SQL migrations (FK + CHECK) + Frontend usage patterns.

---

## 1. Graph chính (hiện trạng single-tenant)

```
auth.users
    │ 1:1 ON DELETE CASCADE
    ▼
profiles (role: ouvrier | chef_equipe | administratif | admin)
    │
    ├──◄── affectations_chantiers.user_id
    ├──◄── affectations_chantiers.chef_equipe_id (SET NULL)
    ├──◄── periodes_travail.user_id
    ├──◄── declarations_heures.user_id
    ├──◄── declarations_heures.validated_by (SET NULL)
    ├──◄── periodes_travail.validated_by (SET NULL)
    ├──◄── zones_equipe.chef_equipe_id (RESTRICT)
    └──◄── zones_ouvriers.user_id

chantiers (Site)
    │
    ├──◄── affectations_chantiers.chantier_id
    ├──◄── periodes_travail.chantier_id
    ├──◄── declarations_heures.chantier_id
    └──◄── zones_chantiers.chantier_id

zones_equipe (nhóm giám sát của 1 chef)
    │
    ├──◄── zones_chantiers.zone_id
    └──◄── zones_ouvriers.zone_id
```

Ánh xạ brief:

```
[Company — KHÔNG có entity trong DB]
        │
        ▼  (toàn project = 1 company)
     Admin / Administratif
        │
        ├── tạo Profiles (via Edge)
        ├── tạo Chantiers (Sites)
        └── gán Affectations
                │
                ▼
          Chef_equipe (Supervisor)
                │
                ├── zones_equipe → zones_chantiers / zones_ouvriers
                └── validate declarations / periods
                        │
                        ▼
                    Ouvrier (Employee)
                        │
                        └── periodes_travail → (trigger) → declarations_heures
```

---

## 2. Quan hệ chi tiết

### 2.1 Identity

| Parent | Child | FK | On delete |
|--------|-------|-----|-----------|
| `auth.users.id` | `profiles.id` | PK/FK | CASCADE |
| `profiles.id` | mọi bảng user-scoped | — | xem dưới |

### 2.2 Organisation công trường

| Parent | Child | Cardinality | Ghi chú |
|--------|-------|-------------|---------|
| `profiles` | `affectations_chantiers` | 1:N | Unique `(user_id, chantier_id)` |
| `chantiers` | `affectations_chantiers` | 1:N | Soft end via `date_fin` |
| `profiles` (chef) | `affectations_chantiers.chef_equipe_id` | 1:N optional | Supervisor trên assignment |

### 2.3 Zones (lớp tổ chức thứ 2)

| Parent | Child | Unique |
|--------|-------|--------|
| `profiles` (chef) | `zones_equipe` | Chef sở hữu nhiều zone; FK **RESTRICT** khi xóa chef |
| `zones_equipe` | `zones_chantiers` | Unique `(zone_id, chantier_id)` |
| `zones_equipe` | `zones_ouvriers` | Active khi `date_fin IS NULL` |

Ouvrier đến được Site bằng: **affectation trực tiếp** OR **zone membership → zones_chantiers**.

### 2.4 Timesheet

| Entity | Role |
|--------|------|
| `periodes_travail` | 1 đoạn ca (có thể nhiều / ngày / chantier) |
| `declarations_heures` | 1 tổng hợp / (user, chantier, date) — **UNIQUE** |
| View `synthese_heures_journalieres` | Aggregate periods → input sync |

**Trigger sync path:**

```
periodes_travail  --AFTER I/U/D-->  sync_declarations_from_periods()
                                            │
                                            ▼
                                   declarations_heures upsert / soft-cancel

declarations_heures --AFTER UPDATE statut--> sync_periods_from_declaration()
                                            │
                                            ▼
                                   periodes_travail statut propagate

declarations_heures --AFTER I/U statut--> auto_approve_if_matches_latest_validated_shift()
```

---

## 3. Dependency order (an toàn khi migrate / seed)

Thứ tự tạo:

1. `auth.users`
2. `profiles`
3. `chantiers`
4. `affectations_chantiers`
5. `zones_equipe`
6. `zones_chantiers` / `zones_ouvriers`
7. `periodes_travail`
8. `declarations_heures` (thường do trigger)

Thứ tự xóa (đã encode trong `delete_chantier_cascade`):

1. `periodes_travail`
2. `declarations_heures`
3. `zones_chantiers`
4. `affectations_chantiers`
5. `chantiers`

Xóa user: Edge chặn nếu còn `zones_equipe`; rồi `auth.admin.deleteUser` → CASCADE profiles + dữ liệu user.

---

## 4. Những quan hệ brief **chưa có**

```
Company ──< Admin   } không có bảng / FK
Company ── DB URL   } không có registry
SuperAdmin ── Company } không có
```

Khi thiết kế backend mới multi-tenant, đây là **greenfield** trên lớp company, không phải remap FK hiện có.
