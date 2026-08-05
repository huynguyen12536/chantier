# IMP06_FE_CONTRACT_REPORT — Frontend Contract Parity

**Role:** Architecture Review (read-only)  
**Rule:** Backend follows frozen FE. No FE change required or recommended by this review.  
**Sources:** `migration-analysis/merge/fe_contract_matrix.md`, `frontend-supabase-usage.md`, `tables-used-by-frontend.md`, FE `types/index.ts`, `declare-day.tsx`, `services/periods.ts`, `hooks/useTimeCalculations.ts`.

---

## 1. Contract obligations (frozen)

| Obligation | Evidence | Imp-06 responsibility |
|---|---|---|
| Preserve table names/payloads at boundary | fe_contract_matrix tables list | Imp-06 REST **or** later adapter (Imp-12) must expose **same shapes** |
| No FE edits | Decision / R-34 | Met in Imp-06 git (no FE files) |
| Realtime periods/declarations | FE inventory; realtime_mapping | Not delivered in Imp-06 |
| Active RPC week approve commented | Flow G | Correctly not revived |

---

## 2. FE field ↔ Imp-06 DTO / schema

### periodes_travail

| FE / dump field | Imp-06 | Compatible? |
|---|---|---|
| `heure_debut` / `heure_fin` | same | YES |
| `panier_repas` | `panier` | **NO** |
| `deplacement` | `deplacement` | YES |
| `latitude_debut` / `longitude_debut` | `latitude` / `longitude` | **NO** |
| `latitude_fin` / `longitude_fin` | absent | **NO** |
| `from_suggestion` | same | YES |
| `statut` | same enum intent | YES |
| `commentaire` | absent | **NO** |
| `validated_by` / `validated_at` | present | YES |

Evidence FE insert shape: `declare-day.tsx` builds `panier_repas`, `latitude_debut`, …  
Evidence Imp-06: `dto.js` / `005_timesheet.sql` / `validation.js`.

### chantiers hours (for CADRE UX)

| FE | Imp-04/06 backend | Compatible? |
|---|---|---|
| `heure_debut` / `heure_fin` | `heure_debut_matin` … `heure_fin_apres_midi` | **NO** without adapter |

Evidence: FE `select('… heure_debut, heure_fin')`; Imp-04 service maps matin/apres_midi only.

### declarations_heures

| Field | Compatible? |
|---|---|
| heures_*, nb_paniers, nb_deplacements, statut | Names largely YES |
| Sync not writing nb_deplacements | YES (DR-003 / C-08 preserve quirk FE may rely on) |

---

## 3. FE call patterns vs API coverage

| FE operation | Legacy | Imp-06 API | Gap |
|---|---|---|---|
| Multi-day insert (declare-day) | PostgREST INSERT many | Single `POST /periods` | Batch not evidenced |
| Overlap pre-check | Client-side | None | Overlap may reach UNIQUE or duplicate periods |
| timesheet CRUD + realtime | table + channel | REST only | Realtime missing |
| start/end period | `services/periods.ts` with GPS debut | PATCH + simplified GPS | Shape break |
| validation decide | UPDATE declarations | `POST …/decide` | Path/shape adapter later; decision semantics OK-ish |
| chef-dashboard period validate | UPDATE periods | Not distinct Imp-06 period-validate API | Deferred Imp-07 risk |
| Week replicate | multi INSERT | not covered | Flow G |

---

## 4. Response / error / loading expectations

| FE behavior | Imp-06 | Notes |
|---|---|---|
| PostgREST error shapes | AppError JSON | Adapter must translate if FE stays on supabase client |
| Loading / optimistic UI | FE-owned | OK if API latency comparable |
| Unique violation day key | Expected | Upsert softens declaration race; period overlaps unhandled |

---

## 5. Adapter ownership clarity

`API_COVERAGE.md` states REST for Wave2 backend consumers and defers FE path aliases to Imp-07/12.  
**There is no Decision Log deferral** in Imp-06 commit citing waiver of `panier_repas` / GPS column parity.

Therefore:

- Claiming “FE Frozen satisfied” by only avoiding FE file edits is **insufficient**.  
- Contract satisfaction requires **either** storage/DTO matching FE shapes **or** an explicit adapter Decision with ownership phase.

---

## FE Contract verdict

**FAIL**

Blockers: field renames (`panier`), GPS collapse, chantier hours naming, missing adapter Decision, realtime gap (secondary vs field blockers).
