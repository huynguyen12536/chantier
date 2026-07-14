# `delete_chantier_cascade`

**Nguồn:** `20260512164000` / `20260513021652` / `20260618071101`.

## Mục đích

RPC xóa toàn bộ dữ liệu phụ thuộc một chantier rồi xóa chantier (vì không có DELETE RLS policy trên `chantiers`).

## Signature

- **Input:** `p_chantier_id uuid`
- **Output:** `void`
- **SECURITY DEFINER**; GRANT EXECUTE TO `authenticated`

## Pseudo code

```
IF caller.role NOT IN ('admin','administratif') RAISE 'Acces refuse'
DELETE periodes_travail WHERE chantier_id = …
DELETE declarations_heures WHERE …
DELETE zones_chantiers WHERE …
DELETE affectations_chantiers WHERE …
DELETE chantiers WHERE id = …
```

## Business Rule

- Chỉ admin / administratif (June widen — trước đó có bản admin-only).
- Xóa cứng periods/declarations (không soft).

## Side effects

Xóa hàng loạt 5 bảng. Triggers trên periods sẽ fire từng row (có thể tạo churn declarations trước khi declarations bị delete).

## Gọi từ Frontend

`management.tsx`, `admin-worksites.tsx` → `supabase.rpc('delete_chantier_cascade', …)`
