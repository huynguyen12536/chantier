# Senior Manual Browser QA Report

**Date:** 2026-07-16  
**Tester role:** Senior QA Engineer (manual browser, mutation allowed)  
**Environment:** FE `http://localhost:16035` · API `http://localhost:3001`  
**Accounts (per test brief):**
- Collaborateur: `jasmine.collab@gmail.com` / `123456`
- Admin: `jasmine.n@gmail.com` / `123456`

**Method:** Cursor IDE browser (real clicks, form fill, navigation). No Playwright/Cypress scripts.  
**Screenshots:** `api-chantier/.audit-shots/manual-qa-2026-07-16/` (session captures in Cursor temp screenshots)

---

## Executive Summary

| Verdict | **FAIL — NOT RELEASE READY** |
|---------|------------------------------|

Core **collaborateur** flows (dashboard, calendar, declaration create, duplicate guard, logout) were exercised successfully in-browser. **Administrator login failed** with documented credentials, blocking validation, export, management CRUD, and realtime dual-session tests. After collab logout, **re-login also failed** for both accounts — session could not be re-established during this run.

**Recommendation:** Do **not** release until admin auth is restored (`node --env-file=.env scripts/reset-passwords-123456.js` or seed repair) and admin CRUD/validation flows are re-tested end-to-end.

---

## Test Scope vs Coverage

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | Authentication | **PARTIAL** | Collab login/logout OK once; invalid creds OK; admin FAIL; re-login FAIL |
| 2 | Dashboard | **PASS** | Stats, week nav, legend, mixed `!` state |
| 3 | Declaration | **PARTIAL** | Create OK; duplicate blocked; edit path OK; delete not done |
| 4 | Fill Week | **NOT DONE** | Opened prefill form; full generate/save/reload not completed |
| 5 | Calendar | **PASS** | Month nav, day click → suggestion → create |
| 6 | Validation | **BLOCKED** | Admin login required |
| 7 | CRUD Users | **BLOCKED** | Admin login required |
| 8 | CRUD Worksites | **BLOCKED** | Admin login required |
| 9 | Management | **BLOCKED** | Admin login required |
| 10 | Export | **BLOCKED** | Admin login required |
| 11 | SSE / Realtime | **NOT DONE** | Dual session not possible after logout |
| 12 | API / Console | **PARTIAL** | Observed auth 401-style UI errors; no 500 during collab session |
| 13 | Regression | **NOT DONE** | Blocked by auth |
| 14 | DB consistency | **PARTIAL** | UI persistence OK for Jul 20 create; no DB direct check |
| 15 | Edge cases | **NOT DONE** | — |
| 16 | Accessibility | **PARTIAL** | Tab roles OK on main nav; login CTA is `<div>` not `<button>` |
| 17 | This report | **DONE** | — |

---

## 1. Authentication

### Collaborateur — PASS (initial session)

| Test | Result | Evidence |
|------|--------|----------|
| Login valid creds | **PASS** | Redirect to `/ouvrier-dashboard`, greeting "Bonjour jasmine" |
| Invalid creds | **PASS** | UI: `Invalid email or password` |
| Session while navigating | **PASS** | Direct `/ouvrier-dashboard` loaded dashboard with data |
| Logout | **PASS** | Profil → `Se déconnecter` → modal `Êtes-vous sûr…` → `Déconnexion` → `/login` |
| Re-login after logout | **FAIL** | Same creds → `Invalid email or password` (screenshot) |

### Administrator — FAIL

| Test | Result | Evidence |
|------|--------|----------|
| Login `jasmine.n@gmail.com` / `123456` | **FAIL** | `Invalid email or password` with fields visibly filled |
| Redirect to `/export` | **NOT REACHED** | — |

**Root cause (likely):** Database/auth parity — forensic reports flag `jasmine.n@gmail.com` as `LOST_AUTHENTICATION` / synthetic password hash. Collab account worked earlier; admin hash may not match `123456` in current DB. Re-login failure for collab after logout suggests broader auth regression or rate-limit during session.

**Layer:** Backend / Database (auth `profiles.password_hash`)  
**Fix:** Run `api-chantier/scripts/reset-passwords-123456.js` against live DB; verify `/auth/v1/token` for both accounts; re-seed if needed.

---

## 2. Dashboard — PASS

| Check | Result | Observed |
|-------|--------|----------|
| Week range display | **PASS** | `13 juil. - 19 juil.` default; navigable |
| Week total | **PASS** | `76.8h` (wk 13–19); `39.6h` (wk 20–26) after declaration |
| Week ◀ / ▶ | **PASS** | ◀ → `6 juil. - 12 juil.`; ▶ → `20 juil. - 26 juil.` |
| Legend | **PASS** | Validée / En attente / Rejetée |
| Day rows + hours | **PASS** | All 7 days populated with `X.Xh` or `—` |
| Mixed state indicator | **PASS** (with UX note) | `Jeu. 16 juillet` shows `16.0h` + yellow `!` (pending+validated mix) |
| Duplicate day rows | **PASS** | No duplicate list entries on dashboard |
| Refresh / navigation | **PASS** | Tab switch preserves week context |

**Defect FE-02 (Medium):** Chart bars all green but Thu 16 has `!` — status inconsistency (Frontend display logic).

---

## 3. Declaration — PARTIAL PASS

### Create — PASS

- **Flow:** Calendar → Jul 20 → suggestion `Chantier 1 (JPX_001) 17:45→23:45` → `Modifier` → `Valider la journée`
- **Result:** Redirect to dashboard wk `20–26 juil.`; **Lun. 20 juillet = 6.0h** (6h slot persisted)
- **Layer:** FE + API + DB (write path OK)

### Duplicate creation — PASS (guard works)

- **Flow:** Re-open same slot on Jul 20, submit again
- **Result:** Stayed on form; dashboard still **6.0h** (no second period)
- **UI error message:** Not visible (silent block)
- **Expected:** 409 + user-facing message — **WARN**: graceful block OK, messaging missing

### Day detail (Jul 16) — observed, not mutated

- `declare-day-empty`: **3 créneaux** carousel `1/3`
  1. **Validée** — Chantier 2 (A2S_002) 07:30→16:30 Panier+Déplacement
  2. **En attente** — Chantier 1 (JPX_001) 12:00→13:00
  3. **En attente** — Chantier 1 (JPX_001) 17:45→23:45 Panier+Déplacement
- `Ajouter un créneau supplémentaire` → `/declare-day` — **PASS**

### Not completed

- Morning / afternoon / evening distinct slots (only evening created)
- Edit existing slot end-to-end
- Delete declaration
- Panier / Déplacement toggle persistence verified on create (toggled before submit; not re-opened)

---

## 4. Fill Week — NOT DONE

- `Remplir ma semaine` / `Préremplir la semaine en cours` opens `/declare-day` with `prefillWeek=1` and weekday chips — UI **OK**
- Full workflow (generate all days → modify → save → reload) **not executed**

---

## 5. Calendar — PASS

| Check | Result |
|-------|--------|
| Tab navigation | **PASS** → `/calendar` |
| Month display | **PASS** — Juillet 2026 |
| Mois précédent / suivant | **PASS** — navigated to Août 2026 and back |
| Day status dots | **PASS** — green/yellow/orange indicators |
| Click day (20) | **PASS** → suggestion → declare → persist |
| Legend | **PASS** — Validée / En attente / Rejetée / Multiple state |

---

## 6–10. Admin flows — BLOCKED

All require admin session:

- Validation (validate / reject / cancel / validate all)
- Export `.xlsx` download
- Management users + worksites CRUD
- Admin-users / admin-worksites deep links

**Cannot claim PASS** for any admin CRUD lifecycle.

---

## 11. SSE / Realtime — NOT DONE

- Single-session SSE not monitored to completion
- Dual-browser (collab + admin) **not executed** (admin auth + post-logout re-login failure)

---

## 12. API & Console (browser-observed)

| Check | Result |
|-------|--------|
| HTTP 500 during collab session | **None observed** |
| Auth failure UI | **401-equivalent** message on login |
| Duplicate POST on declare | **Not observed** (guard prevented) |
| 409 visible in UI | **Not confirmed** (silent block) |
| `zones_chantiers` 400 | **Known** from prior run (`zone_id required`) — not re-hit this session |
| React hydration errors | **None observed** |
| Console errors | **Not fully captured** — recommend DevTools pass |

---

## 13. Regression — NOT DONE

Blocked after auth failure.

---

## 14. Database Consistency (UI-inferred)

| Observation | Result |
|-------------|--------|
| Created Jul 20 declaration persists after nav | **PASS** |
| Duplicate not created (hours unchanged) | **PASS** |
| Jul 16 multiple periods visible in carousel | **PASS** (data present) |
| Orphan / duplicate periods | **Not fully audited** — Jul 16 has 2× JPX_001 slots (different times; not identical duplicate) |

---

## 15–16. Edge Cases & A11y — PARTIAL

| Item | Result |
|------|--------|
| Bottom tabs (`Tableau de bord`, `Calendrier`, `Profil`) | **PASS** — `role=tab`, selected state |
| Calendar month buttons | **PASS** — `Mois précédent` / `Mois suivant` |
| Login `SE CONNECTER` | **WARN** — rendered as `<div>`, not `<button>`; hard to target |
| Login password label overlap | **WARN** — slogan overlaps password field (layout) |
| ESC on logout modal | **Not tested** |
| Double-click Save | **Not tested** |

---

## Defect Backlog

| ID | Sev | Title | Layer | Evidence |
|----|-----|-------|-------|----------|
| **AUTH-01** | **P0** | Admin login fails with documented creds | Backend/DB | Screenshot: `Invalid email or password` for `jasmine.n@gmail.com` |
| **AUTH-02** | **P0** | Re-login fails after logout (collab) | Backend/Auth | Same error post-logout |
| **FE-02** | Medium | Dashboard `!` vs all-green week chart | Frontend | Jeu 16 mixed state |
| **FE-03** | Medium | Duplicate declare: no user error message | Frontend | Silent block on Jul 20 retry |
| **FE-04** | Medium | Login CTA not exposed as button | Frontend/a11y | Accessibility tree shows `generic` refs |
| **FE-05** | Low | Password field layout overlap | Frontend/CSS | Login screenshot |
| **API-01** | Medium | `zones_chantiers` without `zone_id` → 400 | Backend | Prior session |
| **GAP-01** | Coverage | Admin validation/export/CRUD | — | Blocked |
| **GAP-02** | Coverage | Fill week full workflow | — | Not run |
| **GAP-03** | Coverage | Delete declaration | — | Not run |
| **GAP-04** | Coverage | Realtime dual-session | — | Not run |

---

## Evidence Index

| Artifact | Description |
|----------|-------------|
| Login invalid creds | Error banner EN on FR UI |
| Dashboard wk 20–26 | Lun 20 = 6.0h after create |
| declare-day Jul 20 | Chantier 1 (JPX_001) 17:45–23:45 form |
| declare-day-empty Jul 16 | Carousel 1/3, Validée + 2× En attente |
| Calendar Juillet/Août 2026 | Month navigation |
| Profile logout modal | `Déconnexion` / `Annuler` |
| Admin login failure | Filled form + error |
| Post-logout collab login failure | Same error state |

---

## Release Recommendation

| Criterion | Met? |
|-----------|------|
| Collab happy path | **Mostly yes** |
| Admin happy path | **No** |
| Full CRUD proven in UI | **No** |
| Auth for both roles | **No** (admin + re-login) |
| Realtime | **Not proven** |

### **Recommendation: HOLD RELEASE**

**Before re-test:**
1. Reset all profile passwords to `123456`
2. Confirm admin lands on `/export` after login
3. Re-run sections 6–11 and 13–15 with mutation enabled
4. Add UI toast for duplicate period (409)

---

## Proposed Fixes

1. **AUTH-01/02:** `node --env-file=.env scripts/reset-passwords-123456.js`; verify `profiles.password_hash` for `jasmine.n@gmail.com` and `jasmine.collab@gmail.com`
2. **FE-03:** Surface API 409 / conflict message on `declare-day` submit
3. **FE-02:** Align week chart colors with per-day mixed validation state
4. **FE-04/05:** Add `accessibilityRole="button"` + `accessibilityLabel` on login CTA; fix password field z-index/label overlap

---

*Report generated from live manual browser session 2026-07-16. Partial coverage due to auth blocker; collab flows executed with real data mutation (Jul 20 declaration created).*
