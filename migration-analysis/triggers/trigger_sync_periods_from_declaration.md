# Trigger: `trigger_sync_periods_from_declaration`

**Nguồn:** `20260514153000` / `20260618071309`.

## Timing / Events

| | |
|--|--|
| Timing | **AFTER** |
| Events | **UPDATE OF** `statut`, `validated_by`, `validated_at` |
| Table | `declarations_heures` |
| Function | `sync_periods_from_declaration()` |

## Purpose

Lan validate/reject từ declaration → periods cùng khóa ngày.

## Side effects

UPDATE nhiều rows `periodes_travail` → kích `trigger_sync_declarations`.

## Flow

```
Chef/Admin UPDATE declarations_heures.statut = validee|rejetee
        │
        ▼
trigger_sync_periods_from_declaration
        │
        ▼
UPDATE periodes (terminee|en_cours) → same statut
        │
        ▼
trigger_sync_declarations (may re-upsert declaration)
```
