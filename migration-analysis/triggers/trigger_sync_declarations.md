# Trigger: `trigger_sync_declarations`

**Nguồn repo:** Migration work periods + soft-cancel updates.  
**Phase 2 (`hzppst`):** **Present** — AFTER INSERT OR DELETE OR UPDATE → `sync_declarations_from_periods()` (production function body = **hard DELETE**, không soft-cancel).

## Timing / Events

| | |
|--|--|
| Timing | **AFTER** |
| Events | **INSERT OR UPDATE OR DELETE** |
| Table | `periodes_travail` |
| Function | `sync_declarations_from_periods()` |
| Level | FOR EACH ROW |

## Purpose

Giữ `declarations_heures` phản ánh tổng hợp periods trong ngày.  
**Live:** khi hết periods active → **DELETE** declaration.  
**Repo intended:** soft-cancel `annulee` (chưa trên hzppst).

## Side effects

Upsert/update/delete `declarations_heures` → có thể kích auto-approve & sync ngược.

## Flow

```
FE insert/update/delete periodes_travail
        │
        ▼
trigger_sync_declarations
        │
        ▼
sync_declarations_from_periods
        │
        ├─ upsert declaration from view
        └─ or soft-cancel / delete draft
```
