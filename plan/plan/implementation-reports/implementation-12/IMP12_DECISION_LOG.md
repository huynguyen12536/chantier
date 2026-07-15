# IMP12_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** Ownership / path ambiguities open — **coding blocked** until Human answers.

Inherited closed decisions (do not reopen):

- Imp-11 = Administration REST/business FINAL  
- Imp-12 = Compatibility adapters only (DR-IMP11-001)  
- No SQL in Imp-12  
- No Imp-02…11 rewrite

---

## DR-IMP12-001 — Path prefix parity

**Question:** Mount adapters at design SoT paths only, or also FE-observed Supabase prefixes?

| Option | Paths | Impact |
|---|---|---|
| **A (recommended)** | Design **and** aliases: `/functions/create-user` **+** `/functions/v1/create-user`; `/rpc/…` **+** optional `/rest/v1/rpc/…` | Max FE freeze without FE edit if `supabaseUrl` points at Unified host |
| **B** | Design paths only (`/functions/…`, `/tables/…`, `/rpc/…` per openapi) | Needs gateway rewrite or FE env/client change (FE freeze risk) |
| **C** | PostgREST-only `/rest/v1/*` + `/functions/v1/*` | Closest to supabase-js; heavier than design SoT |

**Why open:** FE evidence uses `/functions/v1/…` and supabase-js PostgREST; design packs use `/functions/…` without `v1` and `/tables/…`.

**Needed before coding mounts.**

---

## DR-IMP12-002 — Table adapter breadth

**Question:** Imp-12 ships which table surface?

| Option | Scope |
|---|---|
| **A (recommended MVP)** | Wave A: **profiles** + Edge + RPC cascade only (matches Human examples + Imp-11 Category 6 list) |
| **B** | Wave A + **all 8** FE contract tables allow-list (Flows A–G cutover) |
| **C** | Wave A now; Wave B separate follow-up authorization |

**Why open:** Full 8-table adapters are evidenced but large; Human examples emphasize Admin Edge/RPC/profiles.

---

## DR-IMP12-003 — declarations_heures PATCH mapping

**Question:** When FE `UPDATE declarations_heures SET statut=…`, which Unified command does the adapter call?

| Option | Behavior |
|---|---|
| **A** | Map statut transitions to Imp-07 `/api/validation/declarations/:id/{approve|reject|cancel|return}` |
| **B** | Map to Imp-06 `POST /api/timesheet/declarations/:id/decide` where applicable |
| **C** | Defer declarations write adapter until Wave B + product confirm (GET-only adapter first) |

**Why open:** Unified split validation commands vs CVL single-table UPDATE. Adapter must not invent transitions.

*Only relevant if DR-002 includes timesheet tables.*

---

## DR-IMP12-004 — Auth session adapter in Imp-12?

**Question:** Does Imp-12 include GoTrue/session-compatible adapter so frozen FE login works without FE change?

| Option | Behavior |
|---|---|
| **A** | **Yes** — thin auth compatibility on Imp-02 login/refresh/logout/me (Wave C with A or after) |
| **B** | **No** — Auth remains `/api/auth/*` only; cutover uses separate gateway or later phase |
| **C** | Document-only; out of Imp-12 until FE host proxy defined |

**Why open:** `FE_COMPATIBILITY_ADAPTERS.md` lists auth; Human Imp-12 prompt examples omit auth; Imp-02 already owns auth business.

---

## How to close

Human replies with chosen letters, e.g.:

```
DR-IMP12-001 = A
DR-IMP12-002 = A
DR-IMP12-003 = C (N/A if Wave A only)
DR-IMP12-004 = B
Authorize Wave A coding
```

Then implementer codes **only** adapters within approved wave. No business reopen. No migration.
