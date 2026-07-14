# IMP09_TRACEABILITY — Notifications (pre-implementation)

**Status:** **BLOCKED** — Decision Requests open  
**Module:** Imp-09 Notification BC  
**SoT:** `realtime_mapping.md`, `fe_contract_matrix.md`, MERGE “Keep contract / Defer mechanism”, ADR-001 Notification, C-06 Open

## CVL evidence mapped

| # | Evidence | FE / Flow | Unified requirement | Current codebase |
|---|---|---|---|---|
| N1 | timesheet.tsx `postgres_changes` on `periodes_travail` + `declarations_heures` filter `user_id=eq.{self}` | Flow D live reload | scoped refresh events for worker own rows | **No** emit on Imp-06 write (frozen) |
| N2 | validation.tsx channel on both tables | Flow E queue live | review-queue refresh | Imp-07 `emitReviewEvent` in-process only (no transport) |
| N3 | chef-dashboard `chef_dashboard_{id}` on `periodes_travail` | team pending | scoped team-pending updates | **No** emit on Imp-06; Imp-07 period decide emits in-process |
| N4 | Poll fallback on timesheet (`setInterval`) | resilience | optional; not a replacement for contract | FE-only; backend N/A |
| N5 | MERGE Realtime row | Keep contract / **Defer mechanism** | equivalent notifications before cutover | Mechanism **not** selected |
| N6 | C-06 Open | dump empty publication vs FE subscribe | frozen FE realtime compatibility | **Unresolved** |
| N7 | ADR-001 | Notification owns contract-equivalent events; transport later | Imp-09 ownership | Not implemented as module |

## Imp-09 intended ownership (design — not coded)

| Concern | Owner | Notes |
|---|---|---|
| Event catalog (period/declaration changed; review decided) | Imp-09 | Must match FE refresh needs |
| Authorization / scope of delivery | Imp-09 | Worker self; chef supervised; reviewer scope |
| Transport to clients | **DR-IMP09-001** | Blocked |
| Emission from Time Recording writes | **DR-IMP09-002** | Imp-06 frozen blocks emitters |
| Relation to Imp-07 `notificationHooks.js` | **DR-IMP09-003** | Duplicate vs single Notification BC |

## Ambiguities (cannot invent)

1. Transport mechanism (SSE / WebSocket / outbox+poll / Imp-12 Supabase adapter).  
2. Emitting period/declaration change events without modifying Imp-06.  
3. Whether Imp-07 hooks move into Imp-09 (requires Imp-07 edit) or Imp-09 only subscribers.

## Explicit non-implementation

Until DRs are answered: **no** Imp-09 module code, **no** migration, **no** new realtime API, **no** Imp-05–08 changes.
