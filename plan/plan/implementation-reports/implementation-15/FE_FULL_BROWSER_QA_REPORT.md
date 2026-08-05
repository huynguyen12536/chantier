# FE Full Browser QA Report

**Date:** 2026-07-16  
**Environment:** local Docker — web `http://localhost:16035`, API `http://localhost:3001`  
**Accounts:**
- Collaborateur: `jasmine.collab@gmail.com` / `123456`
- Admin: `jasmine.n@gmail.com` / `123456`

**Method:** headed Chromium walkthrough (click UI like a real user), network monitoring (`/rest/v1`, `/auth/v1`, `/events`, `/functions/v1`), screenshots under `api-chantier/.audit-shots/`.

**Verdict:** **PARTIAL PASS** — core read flows, declaration UI, validation, export, tabs OK. Several defects remain (API 400, duplicate créneaux, dead link, missing codes on legacy list, CRUD create `+` not reliably reachable / not fully proven end-to-end).

---

## 1. Executive summary

| Area | Result |
|------|--------|
| Auth login / logout (both roles) | PASS |
| Collab dashboard + week API data | PASS (`69.8h`, day rows populated) |
| Collab declare / fill-week / calendar / day detail | PASS (UI controls) |
| Admin export (period + `.xlsx` download) | PASS |
| Admin validation (tabs, search, expand, modals) | PASS |
| Admin management list / search / worksite codes | PASS (Gestion tab) |
| Realtime SSE `/events` | PASS (HTTP 200, multiple hits) |
| Management CRUD Create via header `+` | **NOT PROVEN** (automation could not open modal; no `accessibilityLabel` on `+`) |
| Previous known defects | Still present (see §3) |

**Automated control score (session full):** 57 checks → **48 PASS / 4 FAIL / 3 WARN / 1 SKIP / 1 INFO**

---

## 2. Scope covered (buttons / flows / UI)

### 2.1 Login (both roles)
| Control | Result | Notes |
|---------|--------|-------|
| Language **English** / **Français** | PASS | Switches copy correctly |
| **SE CONNECTER** | PASS | Collab → `/ouvrier-dashboard`; Admin → `/export` |
| **Mot de passe oublié ?** | WARN / defect | Clickable but **empty handler** (no navigation / no message) |
| Eye show/hide password | Not separately asserted | Present in UI |
| Device PIN | N/A on web | Native only |

### 2.2 Collaborateur — tabs & screens
| Screen | Controls tested | Result |
|--------|-----------------|--------|
| **Tableau de bord** | Page load, week data API | PASS |
| | Week ◀/▶ | WARN — change not confirmed by automation |
| | **Déclarer aujourd'hui** | SKIP — hidden when week already has hours (**expected**) |
| | **Remplir ma semaine** | PASS → `/declare-day` prefill `Chantier 1 (JPX_001)` |
| | Day row **Jeu. 16 juillet** | PASS → `/declare-day-empty` |
| **declare-day** | Toggle **Panier**, **Déplacement** | PASS |
| | Weekday chips | PASS |
| | Time picker **Début** (+ Annuler) | PASS |
| | Worksite picker | PASS |
| | CTA **Valider la journée** visible | PASS — **not submitted** (avoid more duplicate periods) |
| **declare-day-empty** | Carousel / statuses / codes | PASS |
| | Duplicate slot `JPX_001 17:45→23:45` | **FAIL** — count ≥ 3 in body text |
| | **Ajouter un créneau supplémentaire** | PASS → `/declare-day` |
| **Calendrier** | Load, month nav, click day | PASS (day open suggestion flow) |
| **Profil** | Load, logout modal, **Annuler** | PASS |
| Bottom tabs Dashboard / Calendrier / Profil | PASS | |

### 2.3 Admin — tabs & screens
| Screen | Controls tested | Result |
|--------|-----------------|--------|
| **Statistiques / Export** | Load, stats cards | PASS |
| | **Cette semaine** / **Ce mois** | PASS |
| | **Exporter les données** | PASS — downloaded `export_heures_2026-07-01_2026-07-31.xlsx` |
| **Validation** | Load, **En attente** / **Toutes** | PASS |
| | Subfilters Validée / Annulée | PASS |
| | Search `JPX` | PASS |
| | Expand worksite card (user row, hours) | PASS |
| | **Valider** / **Annuler tout** visible | PASS |
| | **Annuler tout** modal open + dismiss | PASS |
| | **Valider toute l'équipe** modal + **Annuler** | PASS — validate-all **not confirmed** (data safety) |
| | Per-declaration ✓ / ✗ commit | **Not executed** (would mutate pending queue) |
| **Gestion** | Users list load | PASS |
| | Search users | PASS |
| | Worksites tab + codes `JPX_001` / `9QQ_002` | PASS |
| | Search worksites | PASS |
| | Header **+** open Create user/worksite | **FAIL / NOT PROVEN** |
| | Edit / Delete user or worksite end-to-end | **NOT PROVEN** this run |
| **Profil** | Load, logout modal | PASS |
| Tabs Validation / Statistiques / Gestion / Profil | PASS | |
| Deep link `/admin-users` | PASS | |
| Deep link `/admin-worksites` | PASS page; **FAIL** codes missing on list |
| Deep link `/worksite-detail` | PASS | |
| Deep link `/timesheet` | PASS (loads; totals 0h for admin context) | |
| Direct `/ouvrier-dashboard` as admin | INFO | URL stays; admin tab chrome still shown |

---

## 3. Defects backlog (previous + new)

### P0 / High

| ID | Severity | Title | Evidence |
|----|----------|-------|----------|
| **FE-01** | High | Duplicate créneaux same day/slot | Jeu. 16: `JPX_001 17:45→23:45` appears **multiple times** (count=3 in scrape) as *En attente* on `declare-day-empty` |
| **API-01** | Medium | `GET /rest/v1/zones_chantiers` → **400** `zone_id required` | Seen during FE sessions; console `Failed to load resource … 400` |
| **FE-02** | Medium | Status UI inconsistency on dashboard | Chart bars all green (*Validée*) but **Jeu. 16** shows yellow `!` (mixed pending+validated day) |

### Medium

| ID | Severity | Title | Evidence |
|----|----------|-------|----------|
| **FE-03** | Medium | Legacy `/admin-worksites` list **without codes** | Shows duplicate names “Chantier 1 / Chantier 2” with no `JPX_` / `9QQ_` — ambiguous vs Gestion tab which **does** show codes |
| **FE-04** | Medium | Header **+** (Create) hard to target / no a11y label | `TouchableOpacity` + `Plus` icon only — automation failed to open create modal; risk for a11y and QA |
| **FE-05** | Low→Medium | **Mot de passe oublié ?** dead control | `onPress` empty — looks clickable, does nothing |

### Low / UX / coverage gaps

| ID | Severity | Title | Evidence |
|----|----------|-------|----------|
| **FE-06** | Low | Week nav arrows not confirmed | Automation could not prove ◀/▶ changed week range |
| **GAP-01** | Coverage | Full CRUD C/U/D user & worksite | Not completed end-to-end this session |
| **GAP-02** | Coverage | Commit validate / reject / cancel declaration | Modals opened; destructive confirm skipped on purpose |
| **GAP-03** | Coverage | Submit **Valider la journée** | Skipped to avoid worsening FE-01 duplicates |
| **GAP-04** | Coverage | Live SSE event push (admin validate → collab refresh) | Connection OK; event delivery not proven with 2 sessions |

### Previously fixed (regression check)

| Item | Status now |
|------|------------|
| Week list empty / `0h00` due to date serialization | **Fixed** — dashboard shows real hours |
| Gestion worksite cards missing `code` | **OK** on `/management` Chantiers tab |
| Duplicate chantier name confusion | Codes shown in Gestion + Validation |

---

## 4. API / realtime

| Check | Result |
|-------|--------|
| Auth `/auth/v1` login | OK |
| REST reads (periods, declarations, profiles, chantiers, export) | OK for main screens |
| `GET …/zones_chantiers` without `zone_id` | **400** (API-01) |
| SSE `GET /events?access_token=…` | **200** (sseCount ≥ 3 in full run) |
| Export file generation | OK (`.xlsx`) |

---

## 5. Flow correctness (business)

| Flow | Expected | Observed |
|------|----------|----------|
| Collab home | Dashboard with week hours | OK |
| Prefill week | Opens declare form with last pattern + code | OK (`JPX_001`) |
| Day with existing shifts | `declare-day-empty` + add slot | OK UI; **duplicate slots** defect |
| Empty-week CTA | **Déclarer aujourd'hui** only if no hours | OK (hidden) |
| Admin home | Export / stats | OK |
| Admin validate queue | Pending by chantier + codes | OK |
| Admin gestion | Users / chantiers with codes | OK list/search; create `+` unproven |
| Role tabs | Collab 3 tabs / Admin 4 tabs | OK |
| Logout confirm/cancel | Modal then Annuler keeps session | OK |

---

## 6. Screenshots / artifacts

| Path | Content |
|------|---------|
| `api-chantier/.audit-shots/` | Earlier smoke screenshots (dashboard, validation, worksites, …) |
| `api-chantier/.audit-shots/full/full-results.json` | Machine-readable results (57 controls) |
| `api-chantier/.audit-shots/full/*.png` | Per-screen captures from full run |
| `api-chantier/.audit-shots/full/crud-followup.json` | CRUD follow-up (validation modals OK; create `+` still not opened) |

---

## 7. Recommended next fixes (priority)

1. **FE-01 / data:** Deduplicate or block insert of identical `(user, date, chantier, début, fin)` pending slots; surface clear 409 in UI if API already returns conflict.  
2. **API-01:** Stop FE from calling `zones_chantiers` without `zone_id`, or allow list-all for admin with proper authz.  
3. **FE-02:** Dashboard day status / chart color should reflect **mixed** day (pending + validated), not all-green.  
4. **FE-03:** Show `code` on `/admin-worksites` list (parity with Gestion).  
5. **FE-04:** Add `accessibilityLabel` / testID on management header `+` and row edit/delete icons.  
6. **FE-05:** Wire forgot-password or hide the link until implemented.  
7. **QA follow-up:** Manual or instrumented CRUD create→edit→delete user & worksite; dual-session realtime validate event.

---

## 8. Sign-off

| Role | Tester | Conclusion |
|------|--------|------------|
| Collab FE happy-path | Browser QA 2026-07-16 | Usable; watch duplicates on declare |
| Admin FE happy-path | Browser QA 2026-07-16 | Usable for validate/export/list; CRUD create not fully proven |
| Release readiness | — | **Not green** until FE-01 + API-01 addressed (and CRUD smoke signed off) |

---

*Report generated from live local stack walkthrough. Destructive validates/rejects and final Valider la journée submits were intentionally limited to protect seed data; those gaps are listed under GAP-*.*
