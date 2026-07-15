# IMP09_TRACEABILITY

**Date:** 2026-07-15

---

## 1. Decision → code

| Decision | Evidence in code |
|---|---|
| DR-IMP09-001 SSE | `realtime/routes.js` `GET /`, `app.js` `app.use('/events', …)` |
| DR-IMP09-002 Imp-06 post-COMMIT emit | `timesheetService.js` emit after `withTransaction`; `emitTimesheetEvents.js` |
| DR-IMP09-003 Reuse Imp-07 hooks | `notificationHooks.js` → `dispatchDomainEvent`; `reviewDecision.js` still calls `emitReviewEvent` |

## 2. FE contract → backend event

| FE screen (CVL) | FE listen | Unified signal |
|---|---|---|
| timesheet | periods + declarations `user_id=self` | scoped `period.*` / `declaration.*` to worker |
| validation | periods + declarations (reload) | `queue.changed` + declaration catalog |
| chef-dashboard | periods + client team filter | `dashboard.changed` + period events in chef chantier scope |

Source: `IMP09_FE_REALTIME_CONTRACT_REPORT.md`, `FE_COMPATIBILITY_ADAPTERS.md` L18 `/events`.

## 3. Write path → emit

| Write path | When emit | Types |
|---|---|---|
| `createPeriod` | after COMMIT | `period.created` + declaration side-effect |
| `updatePeriod` | after COMMIT | `period.updated` + declaration side-effect |
| `deletePeriod` | after COMMIT | `period.deleted` + declaration side-effect |
| sync / auto-approve (inside TX) | via post-COMMIT period mutation helper | `declaration.submitted` / `.approved` / `.updated` |
| approve / reject / return / cancel | after COMMIT (`emitReviewEvent`) | mapped to catalog + queue/dashboard |
| `decidePeriod` | after COMMIT | `period.updated` (+ queue/dashboard) |

## 4. Ownership reuse

| Concern | Module reused |
|---|---|
| Chef chantier ids | `shared/authz/chefScope.getChefChantierIds` |
| JWT auth on stream | `shared/middleware/auth` (+ query token) |

## 5. Explicit non-trace (out of Imp-09)

| Item | Status |
|---|---|
| FE cutover adapter | Imp-12 |
| Dump `supabase_realtime` publication | C-06 informational; not used by Unified SSE |
| Export / payroll / management live push | Not in CVL FE realtime inventory |
