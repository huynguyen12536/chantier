# `sync_declarations_from_periods`

**Nguồn live (Phase 2):** dump `hzppst` — `production-dump/04_function_bodies.sql`.  
**Nguồn repo (intended):** soft-cancel era `20260515120000` / `20260618071309`.

## Mục đích

Sau mỗi thay đổi `periodes_travail`, đồng bộ dòng `declarations_heures` tương ứng `(user, chantier, date)`.

## Signature

- **Input:** implicit `NEW`/`OLD` (TRIGGER)
- **Output:** `TRIGGER`
- **Attributes:** `SECURITY DEFINER`

## Pseudo code — **Production (hzppst) AUTHORITATIVE**

```
uids = COALESCE(NEW.*, OLD.*) for user_id, chantier_id, date
count_active = COUNT periods where statut != 'rejetee' for that key

IF count_active = 0:
  DELETE FROM declarations_heures WHERE same key
ELSE:
  UPSERT from synthese_heures_journalieres
    columns: heures_normales, heures_supplementaires, nb_paniers, statut, from_suggestion
    -- Does NOT write nb_deplacements
```

## Pseudo code — Repo SoT (NOT deployed on hzppst)

```
IF count_active = 0:
  UPDATE declarations: if statut='soumise' → 'annulee' (+ validated_by/at)
  DELETE declarations where statut NOT IN ('annulee','validee','rejetee')
ELSE:
  UPSERT ... (typically without nb_deplacements in late body)
```

## Business Rule (live)

1. Periods rejected không đếm.
2. Hết periods active → **xóa** declaration (hard delete) trên production hiện tại.
3. Có periods → rebuild từ view (view prod dùng công thức 7h cố định).

## Side effects

- **Đọc:** `periodes_travail`, `synthese_heures_journalieres`
- **Ghi:** `declarations_heures`

## Trigger gọi

`trigger_sync_declarations` AFTER INSERT OR UPDATE OR DELETE ON `periodes_travail`
