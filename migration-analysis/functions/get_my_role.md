# `get_my_role`

**Nguồn:** Production dump `hzppsttpzzeuslnpcdkv` (Phase 2).  
**Không** tìm thấy `CREATE FUNCTION get_my_role` trong `supabase/migrations/` của repo.

## Mục đích

RLS helper: trả về `profiles.role` của `auth.uid()`.

## Signature

- Returns: `text`
- Dùng bởi policies profiles: `"Admins can insert any profile"`, `"Admins can update any profile"` (`get_my_role() = 'admin'`).

## Production note

Có trên hzppst. Khi port AuthZ sang Express, map tương đương `profiles.role` của caller — không cần event logic.
