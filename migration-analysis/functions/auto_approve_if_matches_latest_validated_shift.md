# `auto_approve_if_matches_latest_validated_shift`

**Nguồn:** `20260528091000` / `20260618071549`.

## Mục đích

Tự động validate declaration `soumise` nếu trong ngày chỉ có **một** period active và ca đó **khớp exact** ca `validee` gần nhất của cùng worker (chantier + giờ + panier + déplacement).

## Signature

- TRIGGER function, `SECURITY DEFINER`

## Pseudo code

```
IF NEW.statut <> 'soumise' RETURN
count periods active (not rejetee) for NEW key
IF count <> 1 OR missing hours RETURN
Find latest prior validated period for user (ordered by date/hour)
IF matches chantier + debut + fin + panier + deplacement:
  UPDATE this declaration → validee (validated_at=now)
```

## Business Rule

- Chỉ auto-approve pattern “lặp lại ca đã từng được duyệt”.
- Không set `validated_by` trong UPDATE (chỉ `validated_at`) — **lỗ hổng audit** cần lưu ý khi migrate.

## Side effects

Ghi `declarations_heures` → kích `sync_periods_from_declaration` nếu statut đổi.

## Trigger gọi

`trigger_auto_approve_matching_latest_validated_shift` AFTER INSERT OR UPDATE OF `statut` ON `declarations_heures`
