# FE Full Flow Retest Report (post fix-sprint)

**Date:** 2026-07-16 (session ~13:05–13:07 UTC+7)  
**Tester role:** Senior FE regression after Browser QA Fix Sprint  
**Environment:** local Docker — web `http://localhost:16035`, API `http://localhost:3001`  
**Accounts:**
- Collaborateur: `jasmine.collab@gmail.com` / `123456`
- Admin: `jasmine.n@gmail.com` / `123456`

**Method:** headed Chromium walkthrough (`api-chantier/scripts/ui-retest-full.mjs`), network watch (`/rest/v1`, `/auth/v1`, `/events`, `/functions/v1`), raw JSON: `api-chantier/.audit-shots/retest/retest-results.json`  
**Baseline:** `FE_FULL_BROWSER_QA_REPORT.md` (PARTIAL PASS) + `FE_QA_FIX_SPRINT_REPORT.md`

**Verdict: PASS** — 52 checks → **51 PASS / 0 FAIL / 0 WARN / 1 SKIP**

---

## 1. Executive summary

| Area | Before (QA) | After (retest) |
|------|-------------|----------------|
| Auth login / logout (both roles) | PASS | PASS |
| Forgot password dead link | WARN / defect | **PASS** — control removed |
| Collab dashboard + week data | PASS | PASS (`76.8h`, legend **En attente**) |
| FE-01 duplicate créneau JPX 17:45 | **FAIL** (count ≥ 3) | **PASS** (count = 1) |
| Fill-week / declare-day controls | PASS (no submit) | PASS (no submit — data safety) |
| Calendar / profile / tabs collab | PASS | PASS |
| Admin export `.xlsx` | PASS | PASS |
| Admin validation tabs/modals | PASS | PASS |
| Management `+` create via testID | NOT PROVEN | **PASS** |
| Admin worksites codes (FE-03) | FAIL on legacy list | **PASS** (`JPX_001`, `9QQ_002`, …) |
| API-01 `zones_chantiers` 400 | FAIL | **PASS** (no 400 in session) |
| Realtime SSE `/events` | PASS | PASS (3 hits) |
| Console / API errors in session | mixed | **none** |

Previous defects from the fix sprint are **closed** on this retest. No new FAIL/WARN raised.

---

## 2. Scorecard

| Metric | Value |
|--------|-------|
| Total controls | 52 |
| PASS | 51 |
| FAIL | 0 |
| WARN | 0 |
| SKIP | 1 (`Déclarer aujourd'hui` — hidden when week already has hours; **expected**) |
| API errors logged | 0 |
| Console errors | 0 |
| SSE `/events` | OK (3) |

---

## 3. Collaborateur flows

### 3.1 Login
| Control | Status | Notes |
|---------|--------|-------|
| Forgot password hidden | PASS | No longer shown |
| SE CONNECTER | PASS | → `/ouvrier-dashboard` — Bonjour jasmine Collaborateur |

### 3.2 Dashboard
| Control | Status | Notes |
|---------|--------|-------|
| Load + week API | PASS | Week 13–19 juil., TOTAL **76.8h**; Jeu. 16 = 16.0h with `!` |
| Legend **En attente** | PASS | Status-consistency fix visible |
| Déclarer aujourd'hui | SKIP | Hidden when week has hours (expected) |
| Remplir ma semaine | PASS | Prefill JPX_001 `17:45→23:45` |

### 3.3 declare-day / day detail
| Control | Status | Notes |
|---------|--------|-------|
| Toggle Panier / Déplacement | PASS | |
| Time picker Début | PASS | |
| CTA Valider la journée visible | PASS | **Not submitted** (avoid new periods) |
| Open Jeu. 16 | PASS | 3 créneaux: A2S_002 07:30 Validée; JPX 12:00 En attente; JPX 17:45 En attente |
| **FE-01 no duplicate 17:45** | **PASS** | `count=1` (was ≥3) |
| Ajouter créneau | PASS | → `/declare-day` |

### 3.4 Calendar / profile / tabs
| Control | Status | Notes |
|---------|--------|-------|
| Calendrier load + month nav | PASS | Juillet 2026 + légende |
| Profil + logout modal Annuler | PASS | Matricule USR412154 |
| Tabs Tableau de bord / Calendrier / Profil | PASS | |

---

## 4. Admin flows

### 4.1 Login → Export
| Control | Status | Notes |
|---------|--------|-------|
| Forgot password hidden | PASS | |
| SE CONNECTER | PASS | → `/export` |
| Stats cards | PASS | 63 déclarations / 56 validées / 7 en attente / 513,3 h |
| Période Cette semaine / Ce mois | PASS | |
| Exporter les données | PASS | `export_heures_2026-07-01_2026-07-31.xlsx` |

### 4.2 Validation
| Control | Status | Notes |
|---------|--------|-------|
| Page load | PASS | En attente 4 / Toutes 6; JPX_001 & SXN_003 |
| Tabs En attente / Toutes | PASS | |
| Subfilters Validée / Annulée | PASS | |
| Search JPX | PASS | |
| Expand worksite | PASS | Shows jasmine nguyen 23.75h + actions |
| Validate-all modal + Annuler | PASS | Confirm **not** clicked |
| Annuler tout modal | PASS | Dismissed without commit |

### 4.3 Gestion / worksites / deep links
| Control | Status | Notes |
|---------|--------|-------|
| Users list (10) | PASS | |
| Search users | PASS | |
| Create user via `testID` (+) | **PASS** | Previously NOT PROVEN |
| `/admin-worksites` codes | **PASS** | Codes under names (9QQ_002, JPX_001, A2S_002, SXN_003, …) |
| Worksite detail deep link | PASS | |
| `/admin-users` deep link | PASS | |
| `/timesheet` deep link | PASS | Week grid loads (admin view TOTAL 0h expected for self) |
| Profile + logout modal | PASS | |
| Tabs Validation / Statistiques / Gestion / Profil | PASS | |

---

## 5. System / API / realtime

| Control | Status | Notes |
|---------|--------|-------|
| SSE `/events` | PASS | 3 hits during session |
| API-01 no `zones_chantiers` 400 | PASS | None observed |
| API error bag | PASS | Empty |
| Console errors | PASS | Empty |

---

## 6. Defect regression matrix (fix sprint)

| ID | Issue | Retest |
|----|-------|--------|
| FE-01 | Duplicate pending créneaux same slot | **CLOSED** — UI count=1 |
| API-01 | `GET zones_chantiers` → 400 | **CLOSED** — no 400 |
| FE-03 | Admin worksites missing codes | **CLOSED** — codes visible |
| A11y | Management `+` not automatable | **CLOSED** — testID works |
| UX | Forgot password dead control | **CLOSED** — removed |
| Status | Dashboard legend vs day-row inconsistency | **CLOSED** — En attente in legend |
| Dup POST | Should be 409 not 500 | Verified in fix sprint (not re-POSTed this run) |

---

## 7. Intentionally not executed (data safety)

Same policy as prior QA:

1. **Valider la journée** submit (collab) — would create periods / risk unique-index conflicts.
2. Confirm **Valider toute l'équipe**.
3. Per-declaration validate / reject commit.
4. Full CRUD create-user / create-worksite **submit** (modal open via testID proven; persistence not asserted).
5. Destructive delete user/worksite.

---

## 8. Comparison vs previous QA report

| Metric | Previous QA | This retest |
|--------|-------------|-------------|
| Verdict | PARTIAL PASS | **PASS** |
| FAIL | 4 | **0** |
| WARN | 3 | **0** |
| Known open defects | Several | **None from prior list** |
| Management create (+) | Not proven | Proven via testID |
| Day Jeu.16 unique 17:45 slots | ≥3 | **1** |

Week total hours differ (69.8h → 76.8h) because post-dedupe / data state changed after migrations 012–013; not treated as a defect.

---

## 9. Residual risks / recommendations

1. **Manual smoke once:** submit one collab déclaration on a **new** time slot, then attempt duplicate → expect toast/409 (API already verified in fix sprint).
2. **CRUD persistence:** open create-user / create-worksite, fill form, save, confirm row appears — still worth a short manual pass.
3. Keep `testID`s (`management-create-user`, etc.) for future CI Playwright suites.
4. Re-run this script after any timesheet / management / zones change:  
   `node scripts/ui-retest-full.mjs` (from `api-chantier`).

---

## 10. Artifacts

| Artifact | Path |
|----------|------|
| Machine-readable results | `api-chantier/.audit-shots/retest/retest-results.json` |
| Retest script | `api-chantier/scripts/ui-retest-full.mjs` |
| Prior QA | `FE_FULL_BROWSER_QA_REPORT.md` |
| Fix sprint | `FE_QA_FIX_SPRINT_REPORT.md` |

---

## 11. Sign-off

**FE full-flow retest: PASS.**  
All previously failing regression items from the browser QA report are closed on the local Docker stack. No FAIL/WARN in this session. Remaining gaps are intentional non-mutation of seed data, not product defects.
