# `sync_periods_from_declaration`

**Nguồn:** `20260514153000` / security fix `20260514160000` / `20260618071309`.

## Mục đích

Khi declaration chuyển sang `validee` hoặc `rejetee`, lan trạng thái xuống periods cùng ngày/chantier/user còn `terminee` hoặc `en_cours`.

## Signature

- TRIGGER function, `SECURITY DEFINER`

## Pseudo code

```
IF NEW.statut IN ('validee','rejetee') AND statut changed:
  UPDATE periodes_travail
  SET statut=NEW.statut, validated_by, validated_at, updated_at
  WHERE same user/chantier/date AND statut IN ('terminee','en_cours')
RETURN NEW
```

## Business Rule

- Chỉ chạy khi **đổi** sang validate/reject.
- Không đụng periods đã `validee`/`rejetee` sẵn.
- Frontend validation cũng update periods thủ công ở một số path — logic **trùng / phòng thủ kép**.

## Side effects

Ghi `periodes_travail` → có thể kích `trigger_sync_declarations` (vòng lặp cần cẩn thận; thường statut declaration đã đích nên upsert idempotent).

## Trigger gọi

`trigger_sync_periods_from_declaration` AFTER UPDATE OF `statut, validated_by, validated_at` ON `declarations_heures`
