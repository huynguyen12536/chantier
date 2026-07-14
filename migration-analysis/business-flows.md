# Business Flows

**Nguồn:** Frontend + Edge + Triggers/Functions/RLS.

> Brief mô tả Super Admin → Company. Phần đó **không có trong repo**. Các flow dưới là hiện trạng thật; cuối file ghi “flow mục tiêu chưa implement”.

---

## Flow A — Admin tạo user (Supervisor / Employee / …)

```
Admin (hoặc Administratif) đăng nhập
  → mở management / admin-users
  → POST create-user (Edge)
  → auth.users + profiles (role: ouvrier|chef_equipe|administratif|admin)
  → User mới đăng nhập bằng email/password
```

**Rules:** password ≥ 6; matricule auto nếu trống; chỉ admin/administratif tạo.

---

## Flow B — Admin tạo Site (Chantier) và gán người

```
Admin/Administratif
  → generateWorksiteCode() đọc chantiers.code
  → INSERT chantiers (nom, code, adresse, dates, heure cadre)
  → INSERT/UPSERT affectations_chantiers (user_id, chantier_id, chef_equipe_id?, date_debut)
  → soft remove = UPDATE date_fin
```

Xóa site:

```
rpc delete_chantier_cascade
  → xóa periods, declarations, zones_chantiers, affectations, chantier
```

---

## Flow C — Promote Chef + Zones équipe

```
Admin đổi profiles.role ouvrier → chef_equipe
  → UPDATE affectations.chef_equipe_id nếu cần
Chef (hoặc Admin zone policies)
  → INSERT zones_equipe
  → INSERT zones_chantiers / zones_ouvriers
Ouvrier thấy thêm chantiers qua AuthContext zones_ouvriers join
```

Demotion bị chặn nếu vẫn là chef_equipe_id active hoặc còn zone.

---

## Flow D — Ouvrier khai báo giờ

```
Login ouvrier
  → load assigned worksites (affectations ∪ zones)
  → chọn ngày (calendar / choose-day)
  → declare-day | suggestion | empty | week replicate
  → INSERT periodes_travail (heure, GPS, panier, deplacement, statut terminee thường)
        │
        ▼ TRIGGER sync_declarations_from_periods
  → UPSERT declarations_heures (thường statut=soumise)
        │
        ▼ TRIGGER auto_approve (optional)
  → có thể → validee ngay nếu khớp ca cũ
  → hoặc chờ chef
```

Sửa/xóa dòng timesheet: UPDATE/DELETE periods → trigger lại sync (có soft `annulee` nếu hết periods).

---

## Flow E — Chef / Admin validation

```
Realtime subscription declarations/periods
  → SELECT declarations soumise (scope RLS)
  → Chef UPDATE declarations_heures statut=validee|rejetee (+ validated_by/at)
        │
        ▼ TRIGGER sync_periods_from_declaration
  → periods cùng ngày chuyển statut
FE validation.tsx cũng UPDATE periods thủ công (redundant safety)
```

Cancel:

```
UPDATE declaration → annulee
DELETE related periodes
  → trigger sync soft-cancel paths
```

Chef-dashboard còn path validate/reject **trực tiếp trên periods** (không qua declaration UI).

---

## Flow F — Export paie

```
administratif | admin | chef_equipe (canExport)
  → SELECT periodes_travail validated trong khoảng ngày
  → FE format spreadsheet/CSV (utils/export*)
```

---

## Flow G — Week suggestion replication

```
Ouvrier chọn replicate tuần trước
  → FE quét periods+declarations tuần source
  → INSERT nhiều periodes_travail target
  → triggers tạo declarations
  → (RPC auto_approve_week… đã COMMENT — không chạy)
  → có thể auto_approve matching-shift trigger
```

---

## Flow H — (Mục tiêu brief, CHƯA CÓ CODE)

```
Super Admin (DB A)
  → tạo Company
  → provision DB B / credentials
  → tạo Admin company
  → Admin login DB B
  → tạo Site / Supervisor / Employee
```

Khi thiết kế backend mới: treat as **new platform layer**; map Company Admin ≈ `profiles.role=admin` hiện tại trên DB B.

---

## Sequence tóm tắt end-to-end hiện tại

```
Seed/Admin exists
→ create users (Edge)
→ create chantiers + affectations (+ optional zones)
→ ouvrier login & declare periods
→ DB builds declarations (+ optional auto-approve)
→ chef validates
→ administratif exports
```
