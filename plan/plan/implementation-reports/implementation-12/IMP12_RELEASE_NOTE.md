# IMP12_RELEASE_NOTE.md

**Module:** Imp-12 — Integration Adapters (FE contract compatibility)  
**Date:** 2026-07-15  
**Audience:** Engineering  
**Status:** COMPLETE / RELEASE APPROVED (known limitations)  
**Runtime head:** `d8bb5c83c0`  
**Wave A head:** `a706e1111f`

---

## What was implemented

### Wave A

1. **Edge adapters** — `POST /functions[/v1]/create-user`, `delete-user` → Imp-03/11 users services.  
2. **RPC adapter** — `POST /rpc` + `/rest/v1/rpc/delete_chantier_cascade` → Imp-04 cascade.  
3. **Profiles table** — `GET/PATCH /tables/profiles` (+ id) → Imp-03/11.

### Wave B

4. **Table adapters (dual mount)** — same handlers on `/tables/{table}` and `/rest/v1/{table}` for:  
   `profiles`, `chantiers`, `affectations_chantiers`, `zones_equipe`, `zones_chantiers`, `zones_ouvriers`, `periodes_travail`, `declarations_heures` (GET only).  
5. **Thin auth adapter** — `POST /auth/v1/token`, `POST /auth/v1/logout`, `GET /auth/v1/user` → Imp-02 login/refresh/logout/getProfileById only.  
6. **Tests** — `test/compat.waveA.test.js`, `test/compat.waveB.test.js`; full suite **112/112 PASS**.

Module root: `api-chantier/src/modules/compat/`. No Imp-02…11 business rewrites. No SQL/migrations. No FE changes.

---

## Intentionally deferred (sealed DR)

- Declarations `PATCH`/`UPDATE` / approve/reject/return/cancel (**DR-IMP12-B-003=C**)  
- Affectation upsert transport invent (**DR-IMP12-B-005=B**)  
- Supabase Realtime protocol bridge (**DR-IMP12-B-006=B**)  
- Full PostgREST query grammar  
- Super Admin / export table adapter / inactive week auto-approve RPC  
- Imp-13 production readiness  

---

## Known limitations

- Flow E via frozen FE `declarations_heures` UPDATE is not available through Imp-12; Imp-07 remains sole write owner when later authorized.  
- Live FE Realtime channels are not bridged; Imp-09 SSE remains the Unified transport.  
- Auth adapter is transport-only — JWT/RBAC stay Imp-02.  
- Compat error bodies use Wave A `{ error }` shape.

These match sealed DRs and are accepted for this release.

---

## Ownership reminder

- Imp-12 owns path/envelope translation only.  
- Imp-02 owns JWT / refresh / login / middleware.  
- Imp-04…07 own chantier / affectations / zones / timesheet / validation business.  
- Imp-09 owns realtime SSE.  
- Do not invent second write paths, SQL, or JWT rules in compat.

**No further Imp-12 production work** without new Human authorization.
