# `is_zone_owner`

**Nguồn:** `20260511021110` / `20260618071044`.

## Mục đích

Kiểm tra zone thuộc chef hiện tại, bypass RLS để tránh vòng lặp policy giữa `zones_equipe` ↔ `zones_chantiers` / `zones_ouvriers`.

## Signature

- **Input:** `p_zone_id uuid`
- **Output:** `boolean`
- **Attributes:** `STABLE`, `SECURITY DEFINER`

## Pseudo code

```
RETURN EXISTS (
  SELECT 1 FROM zones_equipe
  WHERE id = p_zone_id AND chef_equipe_id = auth.uid()
)
```

## Business Rule

Chủ zone = `chef_equipe_id` khớp JWT user.

## Side effects

Đọc `zones_equipe` (DEFINER → bỏ qua RLS). Không ghi.
