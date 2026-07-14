# `calculer_duree_periode`

**Nguồn:** `create_work_periods_system` (wave A/B).

## Mục đích

Tính số giờ giữa hai `time` (độ dài ca).

## Signature

- **Input:** `heure_debut time`, `heure_fin time`
- **Output:** `decimal(4,2)`
- **Attributes:** `IMMUTABLE`

## Pseudo code

```
IF heure_fin IS NULL THEN RETURN 0
RETURN hours between debut and fin
```

## Business Rule

Utility thuần; không tenant/auth.

## Side effects

Không.
