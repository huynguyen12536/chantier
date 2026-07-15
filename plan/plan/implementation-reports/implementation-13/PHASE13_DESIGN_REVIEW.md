# PHASE13_DESIGN_REVIEW.md

**Date:** 2026-07-15  
**Mode:** Design Review ONLY — **no production code**  
**Prerequisite:** Phase 13 Investigation COMPLETE · Frontend Usage Audit COMPLETE · Imp-12 COMPLETE  
**Goal:** Fully runnable local product: FE → Imp-12 compat → Unified API → local Postgres  

---

## 1. Architecture answer (mandatory)

### Can Phase 13 achieve a fully runnable local product without violating ownership / SWP / JWT / RBAC / prior DR seals?

**YES — if Human seals the Phase 13 DRs below.**

| Constraint | How Design respects it |
|---|---|
| Single write path | All writes call existing Imp-02…11 **services**; no new SQL in adapters |
| JWT ownership | Tokens issued/verified only in Imp-02; FE consumes Imp-12 `/auth/v1` envelopes |
| RBAC ownership | `requireAuth` / `requireRoles` + service guards unchanged |
| Imp-12 B-003=C | Do **not** reopen: add **new** Phase 13 DR for declarations PATCH → Imp-07 commands (or FE→Imp-07 REST) |
| Imp-12 B-005=B | Do **not** invent upsert protocol: FE calls POST (Imp-05 `assignUser` already ON CONFLICT) |
| Imp-12 B-006=B | Do **not** build Supabase Realtime bridge: FE switches to Imp-09 SSE |
| No PostgREST clone | Allow-list filters + **FE-side composition** of embeds (N+1 client merges) or thin aggregated read adapters that still call services |

**URL-only cutover (keep supabase-js against local API) is REJECTED** — audit proved filters/embeds/Session/Realtime cannot work.

---

## 2. Chosen cutover strategy

**Strategy S3 (Hybrid) — recommended**

| Layer | Change |
|---|---|
| FE | **Scoped thaw**: replace `@supabase/supabase-js` data/auth/realtime usage with a thin `services/apiClient.ts` + AuthContext rewrite + SSE helper; keep UI components |
| Compat (Imp-12+) | **Grow allow-list** mappers (hours alias, filter subset, declarations→Imp-07, chef_equipe patch via assignUser, zone list composition) — transport only |
| Domain | **Untouched** Imp-02…11 business/repos |

---

## 3. Design Review decisions (proposed — NOT SEALED)

See `PHASE13_DECISION_LOG.md` for option tables. Summary:

| DR | Recommended | Meaning |
|---|---|---|
| **DR-P13-001** | **A** | Authorize scoped FE thaw under `chantier1/` for cutover |
| **DR-P13-002** | **B** | Rewrite AuthContext → Imp-12 `/auth/v1` + local token store (no supabase-js auth) |
| **DR-P13-003** | **A** | New compat: declarations PATCH → Imp-07 decide (does not reopen Imp-12 B-003 as Imp-12; Phase 13 additive) |
| **DR-P13-004** | **A** | FE EventSource → Imp-09 `GET /events`; no Realtime protocol bridge |
| **DR-P13-005** | **H** | Hybrid query: expand allow-list filters + FE compose embeds; no PostgREST clone |
| **DR-P13-006** | **A** | Official `npm run seed:local` (hashed demo users) |
| **DR-P13-007** | **A** | Runtime = FE + API + Postgres only (no Redis/MinIO/Mail) |
| **DR-P13-008** | **A** | Compat maps FE `heure_debut`/`heure_fin` ↔ Imp-04 matin/PM fields (mapper only) |
| **DR-P13-009** | **B** | Affectations: FE uses POST (assignUser); chef sync via assignUser body — no upsert invent |

---

## 4. Reclassified prior blockers

| Old ID | Item | New class |
|---|---|---|
| P13-B01 | FE freeze | **CRITICAL** until DR-P13-001 sealed → then **IMPLEMENTATION TASK** |
| P13-B02 | Auth Session | **IMPLEMENTATION TASK** (DR-P13-002=B) |
| P13-B03 | PostgREST grammar | **IMPLEMENTATION TASK** (DR-P13-005) — not architecture-impossible |
| P13-B04 | Declarations UPDATE | **CRITICAL** until DR-P13-003 → then **IMPLEMENTATION TASK** |
| P13-B05 | Realtime | **IMPLEMENTATION TASK** (DR-P13-004=A; FE SSE) |
| P13-B06 | Upsert / chef PATCH | **IMPLEMENTATION TASK** (DR-P13-009) |
| P13-B07 | Zone SELECTs | **IMPLEMENTATION TASK** (compose adapters / FE N+1) |
| P13-B08 | Seed | **IMPLEMENTATION TASK** (DR-P13-006) |
| P13-B09–B12 | CORS / Compose / migrations / Edge+RPC | **IMPLEMENTATION TASK** / ready baselines |
| P13-B13–B17 | MinIO/Redis/Mail/ETL/SuperAdmin | **OUT OF SCOPE** |
| P13-B18 | Imp-08 export path | **OPTIONAL** (keep periodes SELECT for MVP) |
| Hour field mismatch | chantier hours | **IMPLEMENTATION TASK** (DR-P13-008) |

No item remains “architecture impossible.” Remaining human gates are **DR seals**, not unknown unknowns.

---

## 5. Ownership / SWP checklist for Design

| Write | Path |
|---|---|
| Login/refresh/logout | Imp-02 only |
| Users create/delete | Imp-03/11 via Edge compat |
| Chantier CRUD / cascade | Imp-04 |
| Affectations / zones | Imp-05 |
| Periods / declaration sync | Imp-06 TX |
| Declaration approve/reject/cancel | Imp-07 **only** (via new adapter or FE REST) |
| Export | Imp-08 optional later |
| Events | Imp-09 publish unchanged; FE subscribe SSE |
| Jobs | Imp-10 in-process unchanged |

---

## 6. Explicit non-goals

- Full PostgREST clone  
- Supabase Realtime protocol server  
- Imp-02…11 business rewrites  
- Cloud production cutover / ETL  
- Redis / MinIO / Mail  

---

## 7. Recommendation to Human

1. Seal DR-P13-001…009 as recommended (or alternatives in Decision Log).  
2. Authorize Phase 13 coding **after** seal.  
3. Implement per `PHASE13_IMPLEMENTATION_SEQUENCE.md`.

```
Design Review delivered.
DRs RECOMMENDED / NOT SEALED.
NO production code.
Await Human Review.
```
