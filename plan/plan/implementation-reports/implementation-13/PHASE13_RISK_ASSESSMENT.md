# PHASE13_RISK_ASSESSMENT.md

**Date:** 2026-07-15  
**Mode:** Investigation  
**Companion:** `PHASE13_BLOCKERS.md`

---

## 1. Frontend risks

| Risk | Severity | Notes |
|---|---|---|
| Silent partial cutover (URL change only) | **High** | App appears “connected” but fails on embeds / auth / realtime |
| FE freeze vs product goal conflict | **High** | Organizational/process risk |
| Hardcoded cloud URL/anon in `app.config.js` | **High** | Developers keep hitting production Supabase |
| Client-side export/select volume | Medium | Large SELECT without Imp-08 |

## 2. Deployment / DX risks

| Risk | Severity | Notes |
|---|---|---|
| No seed → cannot demo login | **High** | Empty DB |
| Expo device cannot reach `localhost` API | Medium | Needs LAN IP + CORS |
| JWT_SECRET default `change-me-…` | Medium | OK local; document rotation |
| Volume data drift across teammates | Low | Document volume reset |

## 3. Auth risks

| Risk | Severity | Notes |
|---|---|---|
| Token shape mismatch with supabase-js Session | **High** | Login “succeeds” but session invalid |
| Refresh path missing GoTrue routes supabase-js expects | **High** | Silent logout loops |
| Anon key validation invent | Medium | Must not invent Imp-02 policy |
| RBAC: FE trusts profile table vs JWT role | Low | Existing CVL pattern; keep Imp-02 middleware authoritative |

## 4. Realtime risks

| Risk | Severity | Notes |
|---|---|---|
| Protocol gap → stale UIs | **High** | Chef/validation/timesheet depend on channels |
| Bridge invent (Realtime protocol) | **High** | Costly / ownership fight with Imp-09 |
| SSE without FE change | **High** | Does nothing for current `.channel` code |
| Polling degrade | Medium | Acceptable MVP if Human seals DR-P13-004=C |

## 5. Storage risks

| Risk | Severity | Notes |
|---|---|---|
| Accidental MinIO invention | Low | Resist — N/A evidence |
| Future PLD storage | Out of scope | Discovery-gated |

## 6. Compatibility risks

| Risk | Severity | Notes |
|---|---|---|
| Second write path if adapters grow SQL | **Critical** | Forbidden — services only |
| Reopening Imp-12 DRs without Human | **High** | Governance break |
| PostgREST clone creep | **High** | Against FE_COMPATIBILITY_ADAPTERS SoT |
| Error envelope mismatch | Medium | Wave A `{ error }` vs supabase error objects — FE may mis-handle |

## 7. Overall

**Dominant risk class:** Protocol impedance (supabase-js + Realtime + PostgREST grammar) vs Imp-12 thin allow-list adapters.

Mitigation path = Human-sealed Phase 13 DRs (FE thaw + targeted compat growth + SSE client), **not** silent coding.

---

## STOP

Risks recorded for Design Review. No mitigations implemented in this step.
