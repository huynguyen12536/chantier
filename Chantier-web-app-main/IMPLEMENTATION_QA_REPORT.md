# IMPLEMENTATION_QA_REPORT — Chantier Divers

**Environment:** Docker local `http://localhost:16036` → Supabase `afgveikzneaablcuzwdb.supabase.co`  
**Method:** Manual QA via Cursor browser (click/type/fill only; no Playwright/Jest/shell RPC).  
**Accounts:** `jasmine.collab@gmail.com` (declare), `jasmine.n@gmail.com` (admin), `joseph.ad@arson-concept.ch` (RC plan — not logged in this session), password `123456`.  
**Dates:** 2026-07-23 (session 1 + high-risk continuation).

---

## Summary (high-risk focus)

| Category | PASS | FAIL | FIXED | LIMITATION | NOT RUN |
|----------|------|------|-------|------------|---------|
| RJ-01–RJ-05 | 2 | 0 | 0 | 2 | 1 |
| AP-04 / AP-05 | 0 | 0 | 0 | 0 | 2 |
| RC-01–RC-03 | 0 | 0 | 0 | 0 | 3 |
| DI-01–DI-05 | 2 | 0 | 0 | 1 | 2 |
| Roles / Security (scoped) | 3 | 0 | 0 | 1 | 1 |
| Prior CD/PK/AP-01 (session 1) | 12 | 0 | 0 | 1 | — |

**High-risk blockers:** AP-04/AP-05 not browser-run; RC multi-admin not run; RJ-02 dashboard hours ambiguous; RJ-05 reject→approve not run.

---

## Test Matrix — Reject (RJ)

| ID | Result | Evidence |
|----|--------|----------|
| **RJ-01** | **PASS** | Collab created **QA-RJ-Reject-1** on 2026-07-23, validated 1 shift. Admin (`jasmine.n`) `/admin-worksites` → Reject with reason **QA RJ-01 reject test** → **No pending requests** (screenshot `rj01-admin-no-pending.png`). Collab picker search **QA-RJ** → no match (`rj01-picker-search-qarj-empty.png`); `document.body.innerText` had no `QA-RJ` on declare-day. |
| **RJ-02** | **LIMITATION** | After reject, dashboard week 20–26 Jul still lists **Thu 23 July → 6.0h** (no green validated checkmark; chart showed rejected styling in one capture). Expected full removal of active hours per RPC (`periodes_travail` DELETE, declarations `annulee`) — UI may still display 6.0h; needs product confirmation or FE fix. Evidence: `rj02-dashboard-after-reject.png`, CDP text on `/ouvrier-dashboard`. |
| **RJ-03** | **LIMITATION** | After RJ-01, chantier `rejete` — **not** in pending list; no UI to invoke second reject. RPC would raise `Ce chantier divers ne peut pas etre refuse` (migration L210–211). Double reject **not** exercised in browser. |
| **RJ-04** | **PASS** | Collab **QA-RJ-04-ApproveThenReject** on 2026-07-20, validated pending. Admin approved → **No pending requests**. Reject CTA only exists on pending cards (`ChantierDiversAdminSection`) — cannot reject approved chantier from UI (expected). |
| **RJ-05** | **NOT RUN** | Reject-then-approve race on pending not completed (session time / account switching). |

---

## Test Matrix — Post-approve overtime (AP-04 / AP-05)

| ID | Result | Evidence |
|----|--------|----------|
| **AP-04** | **NOT RUN** | No browser proof of outside-frame declare + empty reason block after admin-set frame (e.g. 08:00–17:00). Code path: `requiresFrameReason` + `declare-day.tsx`. |
| **AP-05** | **NOT RUN** | In-frame declare without mandatory reason not isolated in browser after custom approve hours. |

---

## Test Matrix — Race (RC)

| ID | Result | Evidence |
|----|--------|----------|
| **RC-01** | **NOT RUN** | Second browser tab (`browser_tabs` new) stayed `about:blank`; navigation continued on primary tab — could not hold two authenticated admin sessions for simultaneous approve. |
| **RC-02** | **NOT RUN** | Same blocker as RC-01; `joseph.ad@arson-concept.ch` not used. |
| **RC-03** | **NOT RUN** | Double-confirm approve on single tab not executed this session. Design: `FOR UPDATE` + status checks in migration (approve L163–169, reject L205–211). |

---

## Test Matrix — Data integrity (DI)

| ID | Result | Evidence |
|----|--------|----------|
| **DI-01** | **PASS** | After RJ-04 approve, chantier absent from pending — no UI to approve twice (same pattern as plan). RPC: `divers_statut <> 'en_attente'` → `Ce chantier divers ne peut pas etre approuve` (L168–169). |
| **DI-02** | **LIMITATION** | Same as RJ-03 — second reject not invokable from UI after first reject. |
| **DI-03** | **PASS** | Browser: RJ-04 — approved chantier not rejectable from admin pending UI. RPC guard L210–211. |
| **DI-04** | **NOT RUN** | Reject-then-approve (RJ-05) not run. RPC would block approve when not `en_attente` (L168–169). |
| **DI-05** | **PARTIAL** | Admin list shows **5 CHANTIERS** including inactive/rejected names (**QA-RJ-Reject-1**, **QA-RJ-04-ApproveThenReject**) — coherent with admin visibility. Collab picker excludes rejected (`QA-RJ` search empty). Ghost hours on rejected day: see RJ-02. |

---

## Test Matrix — Roles / Security (scoped)

| ID | Result | Evidence |
|----|--------|----------|
| Collab divers CTA | **PASS** | Miscellaneous worksite + create + pending badge (session 1 + RJ flows). Profile label **Collaborator**; CTA visible — if DB role ≠ `ouvrier`, worth aligning with `isWorker()` (`utils/role.ts` L58–59). |
| Collab `/admin-worksites` | **PASS** | Direct URL while collab logged in: page did not show admin pending UI (minimal shell / ouvrier tabs in CDP text). |
| Admin pending | **PASS** | `jasmine.n` — **PENDING MISCELLANEOUS WORKSITES**, approve/reject (RJ-01, RJ-04). |
| Chef | **LIMITATION** | **NOT RUN** browser (user choice). Code: `canReviewChantierDivers` → admin \| administratif only (L62–64); `create_chantier_divers` role check migration L78–80. |
| RPC bypass negative | **NOT RUN** | No Network-tab negative RPC test for chef/ouvrier; migration GRANT/REVOKE + role checks reviewed only. |

---

## Prior session matrix (unchanged highlights)

| Area | Result | Note |
|------|--------|------|
| CD-01, CD-03, CD-05, CD-06 | PASS | Session 1 |
| AP-01 | PASS | **QA Divers Browser** approved |
| AP-02 | LIMITATION | No nom/adresse edit in approve UI |
| RC-03 (old row) | Superseded | Now **NOT RUN** for browser double-click |
| DI-03/04 (old “PASS design”) | Upgraded | DI-03 browser PASS via RJ-04; DI-04 still NOT RUN |

---

## Bugs Found

| ID | Severity | Description |
|----|----------|-------------|
| — | — | No confirmed RPC/RLS **FAIL** in tested flows. |
| **RJ-02-UI?** | Monitor | Rejected day may still show **6.0h** on ouvrier dashboard list while reject RPC cancels declarations — verify FE aggregation vs `annulee` / deleted `periodes_travail`. |

### Observations (non-blocking)

1. **RN Web login:** Admin login often needs password `browser_fill` + CONNECT; invalid credentials when password not bound to RN state.
2. **Sign-out / account switch:** Profile **Sign out** often missing from a11y tree; generic ref `e16`/`e26` + confirm modal works with user approval on some clicks.
3. **Approve modal:** Confirm via last generic ref in snapshot (e.g. `e27`) after opening Approve on pending card.

---

## Known Limitations

| Item | Impact |
|------|--------|
| RJ-03 / DI-02 | No second-reject UI after first reject (by design). |
| AP-02 | Approve RPC fields not in UI. |
| RC | Not manually proven in Cursor browser (tab isolation). |
| Chef CD-02 | Code-only unless chef account tested later. |

---

## Test Matrix — Pending chantier blocks shift validation (DA-01)

**Implemented (2026-07-23):** Migration `20260723120000_divers_pending_block_shift_validation.sql` — DB trigger blocks `declarations_heures` → `validee`/`rejetee` while `chantiers.source = divers` and `divers_statut = en_attente`; `chantiers` added to `supabase_realtime` + `REPLICA IDENTITY FULL`; `approve_chantier_divers` bumps `declarations_heures.updated_at` for connected clients.

| ID | Result | Evidence |
|----|--------|----------|
| **DA-01a** | **NOT RUN (post-impl)** | Ouvrier validates day on pending divers → dashboard should show **muted hours**, **excluded from week total**, gray day row; chef Validation gray card, **no ✓**; pending tab counts exclude blocked shifts. Prior session **QA-DangKy-Truoc-Duyet** showed **—** on dashboard before approve (pre-muted-hours UX). Re-test after migrate + deploy. |
| **DA-01b** | **NOT RUN (post-impl)** | Admin approve → Realtime refresh on ouvrier dashboard + chef Validation (✓ enabled). |
| **DA-01c** | **NOT RUN (post-impl)** | Admin pending list Realtime: new divers `INSERT` appears without F5 (`ChantierDiversAdminSection` channel `admin-divers-pending`). |

**Code:** `isBlockedByPendingDiversChantier` (`utils/chantierDivers.ts`); `validation.tsx`, `ouvrier-dashboard.tsx`, `declare-day-empty.tsx`; i18n `chantierDivers.shiftBlockedUntilWorksiteApproved`, `ouvrierDashboard.chantierPendingHours`.

---

## Remaining Risks

1. **AP-04 / AP-05** — PO mandatory outside approved frame not browser-proven.  
2. **RC-01 / RC-02 / RC-03** — concurrent admin actions not run (incl. `joseph.ad`).  
3. **RJ-05 / DI-04** — reject then approve attempt not run.  
4. **RJ-02** — dashboard hours after reject may mislead users.  
5. **CD-02 / chef RPC** — no negative browser test.  
6. **DA-01** — pending-shift lock + admin Realtime **implemented in code**; browser regression **NOT RUN** after this change (see matrix above).

---

## Final Verdict

**NOT READY FOR RELEASE** (high-risk checklist incomplete)

Core reject happy path **RJ-01** and approve-then-no-reject **RJ-04** **PASS** on browser. Verdict **does not** meet plan rule for **READY FOR RELEASE** until **AP-04, AP-05, RC-01–03, RJ-05, DI-04** are **PASS** or accepted **LIMITATION** with sign-off, and **RJ-02** is clarified or fixed.

**CONDITIONALLY READY** for internal/demo use if stakeholders accept: RC unproven, AP-04/05 code-only, RJ-02 display question, chef untested in browser.

---

## Appendix — Key code references

- Reject: `reject_chantier_divers` — L210–211 status guard; L214–219 cancel declarations / delete periods.  
- Approve: L168–169 `en_attente` only.  
- RLS: rejected divers excluded from collab picker (`divers_statut` / `actif`, migration L242+).  
- FE roles: `canReviewChantierDivers`, `isWorker` in `utils/role.ts`.
