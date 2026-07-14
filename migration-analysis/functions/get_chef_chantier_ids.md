# `get_chef_chantier_ids`

**Nguồn:** `20260522103855` / `20260618071505`.

## Mục đích

Trả về danh sách `chantier_id` mà chef **được gán chính mình** (`affectations_chantiers.user_id = chef` và `date_fin IS NULL`). Dùng cho RLS “co-chef nhìn cùng công trường” không đệ quy policy.

## Signature

- **Input:** `chef_id uuid`
- **Output:** `TABLE(chantier_id uuid)`
- **Attributes:** `STABLE`, `SECURITY DEFINER`

## Pseudo code

```
RETURN QUERY
  SELECT chantier_id FROM affectations_chantiers
  WHERE user_id = chef_id AND date_fin IS NULL
```

## Business Rule

“Managed chantier” theo model **assignment của chef**, không chỉ `chef_equipe_id` trên row người khác.

## Side effects

Đọc `affectations_chantiers`. Không ghi.

## Usage

Policies SELECT/UPDATE/DELETE chef trên declarations / periods / affectations “in their chantiers”. Frontend: `utils/team.ts` logic tương tự nhưng query trực tiếp (không gọi RPC này).
