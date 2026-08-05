# IMP06_GAP_ANALYSIS — Imp-06 Completeness Gaps

**Role:** Architecture Review (read-only)  
**Scope:** Gaps between (a) what Imp-06 analysis claimed for implementation readiness and (b) what CVL / FE Contract / dump require.  
**Git:** `0754a7d338` → `cddc4e452e`

---

## A. Gaps in Domain Analysis (pre-implementation gate)

| Gap ID | Missing artifact / content | Why it blocks implement | SoT mapping |
|---|---|---|---|
| G-A1 | Field dictionary Period ↔ FE/dump (`panier_repas`, GPS 4 cols, `commentaire`) | Implementer invents rename | `production-dump/01_public_schema.sql` periodes; FE `types/index.ts` |
| G-A2 | Explicit AuthZ algorithm for SUMMARY #12 on every write | Implementer can omit gate | SUMMARY #12; Flow D; AuthContext pattern in FE |
| G-A3 | Explicit AuthZ algorithm for SUMMARY #11 (chef list/decide/team write) | Deferred only as “Imp-07” without Decision Log deferral of Flow D read paths | rls-analysis §periodes/declarations; SUMMARY #11 |
| G-A4 | Migration CHECK list copied from dump | Schema invents weaker constraints | dump `periodes_travail_check`, `check1`; declaration hour/panier CHECKs |
| G-A5 | Cadre mapping: FE `chantiers.heure_debut/heure_fin` ↔ Imp-04 matin/apres_midi | DR-002 says use cadre — which columns? | database-schema §2.2; FE declare-day select; `calculer_heures_cadre_chantier.md` |
| G-A6 | Sequence diagrams: declare batch (multi-day), overlap reject, cancel TX order | Analysis §3 sketch only | diagrams/sequence-declare-validate.md; Flow D/E |
| G-A7 | Realtime ownership for Imp-06 vs later | FE Contract requires events | fe_contract_matrix; merge/realtime_mapping.md |
| G-A8 | Error code catalog (HTTP + AppError) per FE-visible failure | Analysis §16 cases incomplete | FE declare-day overlap; UNIQUE; RLS deny |
| G-A9 | Idempotency / retry semantics for UNIQUE race | Analysis §17 mentions retry; no API contract | Analysis §17 |
| G-A10 | Soft Annulee from non-`soumise` / empty after validate | Dead-state incomplete | Analysis §4.2; softAnnulee SQL filter |
| G-A11 | Status hygiene: Analysis says BLOCKED and UNBLOCKED | Gate ambiguous | TIMESHEET_DOMAIN_ANALYSIS §0/§20/§21 |

---

## B. Gaps in Delivery Artifacts vs claimed PASS

| Gap ID | Claim | Reality | Evidence |
|---|---|---|---|
| G-B1 | TRACEABILITY: SUMMARY #12 Binding via service scope | No chantier membership check | `assertCanWritePeriod`; TRACEABILITY_MATRIX row #12 |
| G-B2 | PERMISSION_MATRIX: chef may create own periods | Chef may write **any** `userId` | `assertCanWritePeriod` chef always return |
| G-B3 | VALIDATION_REPORT: API Contract PASS | FE shape FAIL | dto.js vs FE types |
| G-B4 | BUSINESS_RULE_TRACEABILITY: #12 “seed + create” | Seed has affectation; API does not require it | timesheet.test.js inserts affectation but service never reads it |
| G-B5 | LEGACY_MAPPING: RLS outcomes preserved | SELECT/UPDATE outcomes not scoped | listPeriods unscoped for non-ouvrier |
| G-B6 | TEST_REPORT: parity coverage | No assignment deny, auto-approve match/miss, overlap, GPS | timesheet.test.js |
| G-B7 | Migration “CVL tables” | Column subset / rename | 005 vs dump |

---

## C. Missing implementation pieces (if analysis had been “ready”)

| Piece | Status in Imp-06 | Required by |
|---|---|---|
| DTO field names matching FE | Missing / wrong | fe_contract_matrix; FE types |
| Entity column parity | Missing | dump periodes |
| Assignment∪zone Service guard | Missing | SUMMARY #12 |
| Chef scope helper usage | Deferred unmarked | SUMMARY #11; `get_chef_chantier_ids` |
| Batch `POST` periods (declare-day multi) | Single row only | Analysis §14 proposed batch; Flow D |
| Overlap validation | Missing BE | FE declare-day |
| Dump CHECKs | Missing | dump schema |
| Realtime publish | Missing | FE inventory realtime |
| Exception matrix | Partial AppError only | Analysis §16 |
| Sequence / cancel period delete order | Thin | Flow E cancel |
| Flow G regression | Missing | business-flows G |
| Pagination / filter / sort contract | Missing | API_COVERAGE incomplete |

---

## D. Analysis vs Delivery process gap

| Observation | Evidence |
|---|---|
| Analysis commit correctly blocked code on open DRs | `0754a7d338` message |
| Same wave resolved DRs **and** shipped code in one commit | `cddc4e452e` |
| Architecture review gate not satisfied before Auto-Continue Imp-07 | Imp-07 exists in later commits; Imp-06 REVIEW_REPORT already FAIL |

---

## E. Gap priority for readiness re-entry

**P0 (block READY):** G-A1, G-A2, G-A4, G-B1, G-B3, G-B7  
**P1 (block CVL parity):** G-A3, G-A5, G-B2, G-B5, G-B6  
**P2 (harden):** G-A6–G-A10, Flow G, realtime, concurrency locks  

No fixes applied in this review.
