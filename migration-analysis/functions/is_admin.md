# `is_admin`

**Nguồn:** Migration `20260514020807` / replay `20260618071101`.

## Mục đích

Helper RLS: trả về true nếu user đang đăng nhập (`auth.uid()`) có `profiles.role = 'admin'`.

## Signature

- **Input:** không
- **Output:** `boolean`
- **Attributes:** `STABLE`, `SECURITY DEFINER`, `search_path = public`

## Pseudo code

```
RETURN EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

## Business Rule

- Chỉ role đúng chuỗi `'admin'` (không gồm `administratif`).
- Dùng DEFINER để policy không tự SELECT `profiles` dưới RLS (tránh recursion).

## Side effects

Không ghi dữ liệu. Chỉ đọc `profiles`.

## Gọi / được gọi bởi

- Không gọi function khác.
- Được policies Admin trên `zones_*` và `Admin can update profiles`.
