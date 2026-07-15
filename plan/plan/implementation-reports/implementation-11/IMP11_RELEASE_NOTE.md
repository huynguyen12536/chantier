# IMP11_RELEASE_NOTE.md

**Module:** Imp-11 — Administration  
**Date:** 2026-07-15  
**Audience:** Engineering  
**Status:** COMPLETE / RELEASE APPROVED (known limitations)  
**Runtime head:** `2d3ddaed70`

---

## What was implemented

1. **`PATCH /api/users/:id`** (admin only) — edit email, nom, prenom, phone; role promote/demote.  
2. **Role lifecycle policies** — cannot change own role; cannot change role of an admin user.  
3. **Demotion guards** — block demoting `chef_equipe` who still has an active affectation chef or owns a zone (**READ** Imp-05 tables only).  
4. **Matricule immutability** on PATCH.  
5. **Additive migration** `010_imp11_admin_profiles.sql` — `profiles.phone` + nonempty matricule UNIQUE.  
6. **Create path** — required nom/prenom; optional phone wiring.  
7. **Structured logs** — `admin.user.created|updated|deleted`.  
8. **Tests** — `test/admin.users.test.js`.

---

## Intentionally deferred

- Promote → `affectations.chef_equipe_id` sync (**DR-IMP11-005=B**)  
- Edge `/functions/create-user|delete-user` and other Imp-12 adapters  
- Imp-12 Wave B table adapters  
- Super Admin / multi-company  
- Admin audit SQL table  
- Phase 11 ETL / cutover  
- Imp-13 production readiness  

---

## Known limitations

- Role promotion does **not** auto-write Imp-05 affectation chef fields.  
- Admin audit is **logs only**.  
- `actif` is not part of the Imp-11 PATCH surface.  

These match sealed DRs and are accepted for this release.

---

## Ownership reminder

- Imp-11 owns Administration PATCH / role policies / phone UNION.  
- Imp-05 owns affectations/zones **business** — Imp-11 only **reads** for guards.  
- Imp-12 owns frozen-FE Edge/RPC aliases.  
- Do not invent Outbox/replay or Imp-06/07 writes from Administration.

**No further Imp-11 production work** without new Human authorization.
