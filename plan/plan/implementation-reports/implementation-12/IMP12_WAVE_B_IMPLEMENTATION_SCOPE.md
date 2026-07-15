# IMP12_WAVE_B_IMPLEMENTATION_SCOPE.md

**Date:** 2026-07-15  
**Mode:** Investigation — describes **future** boundaries if Human authorizes Wave B coding  
**No code now.**

---

## What production code MAY eventually be written (Wave B)

| Area | Nature |
|---|---|
| `compat/tables/*.routes.js` (+ controllers/mappers) | Thin adapters for remaining 7 tables (allow-list verbs) |
| Optional dual mounts | `/rest/v1/{table}` → same handlers if DR approves |
| Compat tests | Contract tests calling existing services via adapters |
| Docs / reports | After coding authorization |

Only if Human reopens/answers BLOCKED DRs:

| Area | Nature |
|---|---|
| Declarations UPDATE mapper | Map FE statut patch → Imp-07 commands |
| Auth compatibility routes | Map GoTrue/session → Imp-02 |

---

## What is EXPLICITLY FORBIDDEN

| Forbidden | Why |
|---|---|
| Imp-02…11 business/repository rewrites | Ownership |
| SQL / migrations | Imp-12 policy |
| Duplicate cascade/sync/decide/demotion | No second write path |
| Realtime protocol invent / Imp-09 rewrite | NOT IMP-12 |
| FE `chantier1/` edits | Frozen |
| Full PostgREST clone | Design SoT |
| Imp-13 / ETL | Wrong phase |
| Re-implement Wave A Edge/RPC/profiles | Already done |

---

## Code that will NOT be written in Wave B by default

- Supabase Realtime bridge  
- Export table adapter  
- Super Admin  
- Inactive auto-approve RPC  
- Domain background jobs  

---

## Production code now?

**NO.**

```
Imp-12 Wave B investigation only.
Coding blocked until Human Review + Wave B DRs.
```
