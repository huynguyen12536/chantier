# Trigger: `trigger_auto_approve_matching_latest_validated_shift`

**Nguồn:** `20260528091000` / `20260618071549`.

## Timing / Events

| | |
|--|--|
| Timing | **AFTER** |
| Events | **INSERT OR UPDATE OF `statut`** |
| Table | `declarations_heures` |
| Function | `auto_approve_if_matches_latest_validated_shift()` |

## Purpose

Auto-validate declaration lặp lại ca đã từng được duyệt.

## Side effects

Có thể đổi `soumise` → `validee` không qua UI chef → kích `trigger_sync_periods_from_declaration`.

## Flow

```
Period insert → sync creates declaration soumise
        │
        ▼
auto-approve trigger
        │
        ├─ match prior validated shift? → set validee
        └─ else leave soumise for chef
```
