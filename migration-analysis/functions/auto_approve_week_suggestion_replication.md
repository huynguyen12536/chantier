# `auto_approve_week_suggestion_replication`

**Nguồn repo:** `20260604103000` / `20260618071612`.  
**Phase 2:** **Không có trên production `hzppst`** (khớp FE đã comment RPC call).

## Mục đích

Sau khi FE replicate tuần trước, duyệt hàng loạt declarations `soumise` nếu plans JSON khớp periods nguồn `validee` và periods đích đã tạo.

## Signature

- **Input:** `p_plans jsonb` (array of plan objects)
- **Output:** `integer` (số group đã approve)
- **SECURITY DEFINER**; GRANT TO `authenticated`

## Pseudo code

```
user = auth.uid(); IF null RAISE Unauthorized
Group plans by (target_date, chantier_id)
For each group:
  IF target period count != plan count CONTINUE
  For each plan: verify source validated period exists with exact hours/flags
                 verify target period exists with same shape
  IF all ok: UPDATE declarations → validee for that day/chantier (soumise only)
Return approved_count
```

## Business Rule

- Chỉ duyệt declaration của **chính** `auth.uid()`.
- Filters periods `NOT IN ('rejetee','annulee')` dù CHECK periods không có `annulee` (dead filter).

## Side effects

UPDATE `declarations_heures` → triggers sync/auto.

## Frontend

Call trong `utils/ouvrierDeclaration.ts` **đã comment** — hiện replicate chỉ insert periods; auto-approve dựa trigger matching-shift hoặc chef thủ công.
