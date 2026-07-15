# IMP12_WAVE_B_IMPLEMENTATION_SCOPE.md

**Date:** 2026-07-15  
**Status:** **DELIVERED** — Wave B complete at `d8bb5c83c0`  
**Module Imp-12:** **COMPLETE**  
**Seal:** `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`

---

## What production code WAS written (Wave B)

| Area | Nature |
|---|---|
| `compat/tables/*` routes/controllers | Thin adapters for 7 tables (allow-list verbs) |
| Dual mounts | `/tables` + `/rest/v1` same handlers (**B-002=A**) |
| Thin auth | `/auth/v1` → Imp-02 only (**B-004=A**) |
| Compat tests | `test/compat.waveB.test.js` |
| Docs / reports | Implementation + closure pack |

Declarations UPDATE mapper: **NOT written** (**B-003=C**).

---

## What is EXPLICITLY FORBIDDEN (still stands)

| Forbidden | Why |
|---|---|
| Imp-02…11 business/repository rewrites | Ownership |
| SQL / migrations | Imp-12 policy |
| Duplicate cascade/sync/decide/demotion | No second write path |
| Realtime protocol invent / Imp-09 rewrite | B-006=B / NOT IMP-12 |
| FE `chantier1/` edits | Frozen |
| Full PostgREST clone | Design SoT |
| Imp-13 / ETL | Wrong phase |
| Re-implement Wave A Edge/RPC | Already done |

---

## Code intentionally NOT written (sealed DR)

- Declarations UPDATE → Imp-07 (**B-003=C**)  
- Affectation upsert invent (**B-005=B**)  
- Supabase Realtime bridge (**B-006=B**)  
- Export table adapter / Super Admin / inactive auto-approve RPC  

---

## Production code now?

**Wave B already landed at `d8bb5c83c0`.**  
**No further Imp-12 production code** without new Human authorization.

```
Imp-12: COMPLETE
Release: APPROVED
Seal: IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS
```
