# PHASE13_FE_TO_BACKEND_MATRIX.md

**Date:** 2026-07-15  
**Evidence-based gap matrix** — classes only (no design recommendations)

| Class | Meaning |
|---|---|
| **READY** | Existing Imp-12 adapter + owner service covers the observed call if transport can reach it |
| **Needs FE change** | Cannot work without changing frozen FE call sites / client |
| **Needs compatibility extension** | Owner service exists; Imp-12 surface missing or too narrow for observed PostgREST shape |
| **Blocked by sealed DR** | Explicit Imp-12 sealed omission |
| **Dead code** | Present but inactive |
| **Out of scope** | Not CVL FE contract for Phase 13 product |

---

## Matrix

| FE capability | Evidence | Class | Backend note |
|---|---|---|---|
| Edge create-user fetch | management, admin-users | **READY** | Imp-12 → Imp-03/11 |
| Edge delete-user fetch | same | **READY** | Imp-12 → Imp-03 |
| RPC delete_chantier_cascade | management, admin-worksites | **READY** | Imp-12 → Imp-04 |
| RPC auto_approve week | ouvrierDeclaration commented | **Dead code** | — |
| seed-test-users Edge | no UI call | **Dead code** / Out | — |
| Auth signInWithPassword | AuthContext | **Needs FE change** and/or **Needs compatibility extension** | Imp-12 `/auth/v1` exists; Session lifecycle gap |
| Auth getSession / onAuthStateChange / autoRefresh | AuthContext, supabase.ts | **Needs FE change** / **Needs compatibility extension** | **NO EXISTING** Session bus |
| Auth signOut local | AuthContext | **READY** (local) | Optional Imp-12 logout unused today |
| profiles GET/PATCH simple | AuthContext, management | **Needs compatibility extension** | Imp-12 profiles exist; `.eq`/order filters narrow |
| chantiers CRUD using `heure_debut`/`heure_fin` | management, admin-worksites, FE types | **Needs FE change** **or** **Needs compatibility extension** | Field rename vs Imp-04 matin/PM |
| chantiers SELECT list | many | **Needs compatibility extension** | Imp-12 list OK; filters/embeds partial |
| affectations SELECT with embeds | AuthContext, worksites | **Needs compatibility extension** | Imp-05 list flat |
| affectations INSERT | many | **READY** (narrow) | Imp-12 → assignUser |
| affectations UPSERT | management | **Blocked by sealed DR** | Imp-12 B-005=B |
| affectations UPDATE chef_equipe_id | management sync | **Needs compatibility extension** | PATCH maps only softRemove |
| affectations soft date_fin | many | **READY** | Imp-12 softRemove |
| zones_equipe deep SELECT | team-management | **Needs compatibility extension** | Imp-05 listZones flat |
| zones write link/ouvrier | team-management | **READY** (narrow paths) | Imp-12 zones routes |
| zones_chantiers SELECT embed | management | **Needs compatibility extension** | No list adapter |
| zones_ouvriers SELECT embed | AuthContext | **Needs compatibility extension** | No list adapter |
| periodes SELECT with filters/embeds | widespread | **Needs compatibility extension** | Imp-12 GET limited query params |
| periodes INSERT/UPDATE/DELETE | timesheet, declare, chef, validation | **READY** (if body/DTO fields align) | Imp-12 → Imp-06 |
| declarations SELECT embeds | validation, dashboards | **Needs compatibility extension** | Imp-12 GET listDeclarations flat |
| declarations UPDATE statut | validation | **Blocked by sealed DR** | Imp-12 B-003=C; Imp-07 owner |
| periods DELETE on cancel | validation | **READY** | Imp-12 → Imp-06 |
| Realtime postgres_changes | 3 screens | **Blocked by sealed DR** | Imp-12 B-006=B; Imp-09 SSE ≠ protocol |
| Export periodes SELECT | export.tsx | **Needs compatibility extension** | Imp-08 exists but **FE does not call it** |
| Storage | none | **Out of scope** | — |
| functions.invoke | none | **Out of scope** | — |
| supabase URL hardcode | app.config.js | **Needs FE change** | Env |

---

## Blockers remaining (from this matrix)

1. Auth Session lifecycle vs token REST  
2. PostgREST filters + embeds vs Imp-12 allow-list  
3. Declarations UPDATE (**B-003=C**)  
4. Realtime protocol (**B-006=B**)  
5. Affectations UPSERT invent (**B-005=B**) + chef_equipe PATCH  
6. chantiers hour field naming mismatch  
7. Hardcoded cloud env in `app.config.js`
