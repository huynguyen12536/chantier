# Browser QA Fix Sprint — Deliverable

**Date:** 2026-07-16  
**Source of truth:** `FE_FULL_BROWSER_QA_REPORT.md`  
**Stack verified:** API `:3001`, Web `:16035`, DB local + test migrations applied

---

## 1. Root causes (per issue)

### FE-01 — Duplicate créneaux
| Layer | Finding |
|-------|---------|
| **Database** | **Primary cause.** Two identical active rows for JPX_001 / 2026-07-16 / 17:45→23:45 / `panier=true` (created 3s apart). A third row same times with `panier=false` also existed. Unique index from `011` was **skipped** because duplicates already existed. |
| API | `findDuplicatePeriod` + 409 existed but **included panier in identity**, so same times with different panier could insert. Race on concurrent POSTs could still insert before unique index existed. |
| FE | `submitting` state alone does not block a second tap before re-render (`setState` async). |
| Rendering | UI correctly rendered every DB row — not a merge/key bug. |

**Fix:** Dedupe → unique index without panier → tighten duplicate check → FE `submittingRef` → remove superseded rejetee clones.

### API-01 — `zones_chantiers` 400
| Layer | Finding |
|-------|---------|
| **FE** | `management.loadZones()` calls `from('zones_chantiers').select(...)` **without** `zone_id`. |
| **API** | Compat handler required `zone_id` → 400 on normal Gestion navigation. |
| DB | Table may be empty locally (`COUNT=0`); empty list is valid — 400 was not. |

**Fix:** Backend supports scoped list-all for admin/administratif/chef when `zone_id` omitted. Ouvrier still requires `zone_id`.

### Duplicate period → 500
| Layer | Finding |
|-------|---------|
| API | `createPeriod` already mapped `23505` → 409; strengthened by unique index + panier-agnostic duplicate check. |

**Verified:** second POST same slot (even with opposite panier) → **409** `Period already exists.`

### Admin worksites missing codes
| Layer | Finding |
|-------|---------|
| **FE** | `/admin-worksites` rendered `ws.nom` only; Gestion already showed `ws.code`. |

**Fix:** Show code under name (parity with Gestion).

### Management Create (+)
| Layer | Finding |
|-------|---------|
| **FE** | Header `+` / edit / delete were icon-only `TouchableOpacity` without `accessibilityLabel` / `testID`. |

**Fix:** Labels + stable `testID`s on create/edit/delete (Gestion + admin-worksites).

### Forgot password
| Layer | Finding |
|-------|---------|
| **FE** | Control had empty `onPress` (dead UI). |

**Fix:** Removed until a real reset flow exists.

### Dashboard status inconsistency
| Layer | Finding |
|-------|---------|
| **FE** | Chart bars counted only `validee` / `rejetee`; day rows used mixed logic (`!` when ≥2 statuses). Pending was invisible on the chart → false “all green”. Hours counted only validated lines. |

**Fix:** Chart includes pending (and mixed colour); legend adds En attente; day hours include all non-rejected periods (aligned with declared work).

---

## 2. Files modified

### Backend
- `api-chantier/src/modules/timesheet/repository.js` — duplicate check without panier + `FOR UPDATE`
- `api-chantier/src/modules/zones/service.js` — `listAllZoneChantiers`
- `api-chantier/src/modules/compat/tables/zones.controller.js` — list without `zone_id`
- `api-chantier/test/timesheet.parity.test.js` — 409 also for different panier

### Frontend
- `app/declare-day.tsx` — `submittingRef` double-submit guard
- `app/declare-day-suggestion.tsx` — same
- `app/(tabs)/ouvrier-dashboard.tsx` — chart/hours/status consistency
- `app/(tabs)/admin-worksites.tsx` — codes + a11y
- `app/(tabs)/management.tsx` — a11y / testIDs
- `app/(auth)/login.tsx` — hide forgot-password

### Database migrations
- `api-chantier/migrations/012_period_slot_dedupe_unique.sql`
- `api-chantier/migrations/013_remove_superseded_period_clones.sql`

---

## 3. Backend changes (summary)

1. Slot identity = `(user_id, chantier_id, date, heure_debut, heure_fin)` (panier excluded).
2. Unique partial index enforced after cleanup.
3. `GET /rest/v1/zones_chantiers` without `zone_id` → **200** scoped list (admin/chef); ouvrier still 400 if no `zone_id`.

---

## 4. Frontend changes (summary)

1. Hard double-submit lock on declare flows.
2. Dashboard chart/legend/hours match mixed pending+validated days.
3. Admin worksites show codes; management/admin action icons labelled for a11y/automation.
4. Dead forgot-password control removed.

---

## 5–6. Database / migrations

| Migration | Action |
|-----------|--------|
| **012** | Rank duplicates; mark younger as `rejetee`; create `periodes_travail_slot_uidx` **without** panier |
| **013** | `DELETE` rejetee clones that already have an active same-slot replacement (keeps true chef rejections with no replacement) |

**After on local DB (collab / 2026-07-16):**

| statut | heure | panier |
|--------|-------|--------|
| validee | 07:30→16:30 | t |
| terminee | 12:00→13:00 | f |
| terminee | 17:45→23:45 | t |

→ **one** active 17:45 slot (FE-01 fixed at source).

---

## 7. API examples

### zones_chantiers (was 400)
```http
GET /rest/v1/zones_chantiers
Authorization: Bearer <admin>
→ 200 []   # empty table locally is OK; no longer 400
```

### Duplicate period
```http
POST /rest/v1/periodes_travail
{ "chantier_id":"…","date":"2026-08-22","heure_debut":"08:00","heure_fin":"09:00","panier_repas":false }
→ 201

POST … same times, panier_repas:true
→ 409 {"error":"Period already exists."}   # or AppError envelope with message
```

---

## 8. Regression results

| Check | Result |
|-------|--------|
| `npm test` (api-chantier, full suite after migrate:test) | **119 pass / 0 fail** |
| Live: health | 200 |
| Live: zones list-all admin | 200 |
| Live: duplicate create | 201 then **409** |
| Live: Jul 16 active slots | **3 unique** (no duplicate 17:45) |
| Docker web rebuild | healthy `:16035` |
| Docker API rebuild | healthy `:3001` |

Manual UI (hard-refresh web): Login / Dashboard / Declare / Fill week / Calendar / Export / Validation / Gestion / Profile remain the same entry points; status chart now surfaces pending; admin-worksites shows codes; create `+` has `testID=management-create-user|worksite`.

---

## 9. Remaining known issues

1. **`zones_chantiers` local data empty** — Gestion zone map stays empty until zones are linked; no more 400 noise. Seed/ETL of zone links is separate from this sprint.
2. **Forgot-password** — intentionally absent; implement real reset later.
3. **SSE dual-session event proof** — connection previously OK; not re-proven in this sprint.
4. **Full CRUD create→delete via automation** — a11y added; end-to-end CRUD click-through not re-run here.
5. GitNexus `detect_changes` reports high process fan-out around `createPeriod` / `handleSubmit` (expected); behaviour covered by 409 + unique index tests.

---

## 10. Sign-off

Root causes addressed at the correct layer (DB uniqueness + API contract + FE guards/UI consistency). Not a cosmetic-only patch: duplicate rows cleaned with audit-safe policy, future inserts blocked by index + 409, and UI no longer lies about day status.
