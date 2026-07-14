# NEXT ACTION MATRIX — Legacy labeling + Consolidation

**Purpose:** Hành động sau xác nhận human.  
**Updated:** 2026-07-14 — Consolidation + Replatforming.

Hai track độc lập:

| Track | Mục tiêu | Có chặn Merge Spec? |
|---|---|---|
| **L** Legacy env labeling (Phase 2 historical) | Map afgveikz / hzppst / other → env/system labels | Soft — cải thiện evidence Legacy |
| **C** Consolidation | Định danh FE/Supabase A+B → Phase 3 Merge Spec | **Hard** — bắt buộc A+B hoặc Decision Log exception |

Scenarios A–D dưới đây = **Track L** (giữ logic dump). Sau mỗi scenario, Database SoT cũ được hiểu là **Legacy Database Evidence**, không phải Unified SoT.

---

## Track C — Start Merge Specification (ưu tiên thiết kế)

| Human confirms | Agent does |
|---|---|
| **C1** FE A path + FE B path + Supabase A + Supabase B identified | Ingest B RE if needed → start `phase_03_merge_specification` |
| **C2** Only one product exists (B = same as A / deferred) | Decision Log exception → Merge Spec “single-legacy consolidation” path |
| **C3** B unknown | **Stop** — do not invent second system from dual project refs alone |

Project refs afgveikz / hzppst **không** tự động = A/B products.

---

## Scenario A — Runtime / primary env = `afgveikzneaablcuzwdb` (Track L)

| Question | Answer |
|---|---|
| Dump lại? | **Yes** — schema-only dump afgveikz |
| Cập nhật docs? | **Yes** — Legacy dump evidence + diff vs migrations |
| Mở lại Phase 2? | **Yes** — Gate labeling |
| Promote Unified SoT? | **No** |
| Sang Phase 3 Merge Spec? | Khi Track C Gate satisfied (not solely because A closed) |

### Steps
1. Credentials afgveikz.  
2. Dump → `migration-analysis/production-dump/` (label `afgveikz_*`).  
3. Diff vs repo.  
4. Update `SOURCE_OF_TRUTH_DECISION.md` — Runtime ref labeled; dump = Legacy evidence.  
5. Human approve Phase 2 Track L Done.  
6. Proceed Track C / Merge Spec when ready.

**hzppst dump:** secondary Legacy evidence.

---

## Scenario B — Confirmed env = `hzppsttpzzeuslnpcdkv` (Track L)

| Question | Answer |
|---|---|
| Dump lại? | **No** (unless refresh requested) |
| Promote Verified Dump? | As **Legacy Database Evidence** for that env — not Unified DB |
| Phase 2? | Gate adopt only |
| Merge Spec? | Track C |

### Steps
1. Decision Log + SoT doc: hzppst = labeled Legacy dump.  
2. Align docs calling it “Production SoT” → Legacy evidence wording where touched.  
3. Human approve Phase 2 Track L.  
4. Track C independently.

---

## Scenario C — Runtime = other project (Track L)

Same as A for the new ref. Keep prior dumps as alternate Legacy evidence.

---

## Scenario D — Cannot verify Runtime (Track L)

| Question | Answer |
|---|---|
| Phase 2 Track L | Remain Waiting External Confirmation |
| Merge Spec | **Allowed** only if Track C satisfied another way (B inputs exist / Decision Log) |
| Unified Backend Design | **Blocked** until Merge Spec |

---

## Explicit bans

- No Backend / API / Entity / data migration in these scenarios alone.  
- No “clone Supabase” / 1:1 migrate as exit of any scenario.  
- No treating dual refs as dual products without Product confirmation.
