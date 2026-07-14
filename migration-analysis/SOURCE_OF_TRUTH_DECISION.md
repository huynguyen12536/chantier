# SOURCE OF TRUTH DECISION — Production Source Validation

**Date:** 2026-07-14  
**Gate:** After Phase 2 dump attempt — **before** Phase 3  
**Status:** **Technical Investigation Complete** · **Waiting External Confirmation**  
**Rule:** Không suy đoán. Không kết luận `hzppst = production` khi chưa chứng minh Runtime DB == Dump DB.

---

## 1. Repository runtime đang dùng project nào?

**Trả lời (bằng chứng trong repo):** project ref **`afgveikzneaablcuzwdb`**.

| Evidence | Path / detail |
|---|---|
| Hardcoded Expo URL + anon JWT `ref=afgveikz…` | `app.config.js` L9–11 |
| EAS preview + production env | `eas.json` |
| Env template | `.env.example` |
| FE client resolve | `services/supabase.ts`: env → `expo.extra` |
| Workspace `.env` | **Không có** |

**Không chứng minh được từ repo:** URL thật trên `chantier.vm.dfm-europe.com/` (CI `secrets.EXPO_PUBLIC_SUPABASE_*`).

---

## 2. Database vừa dump thuộc project nào?

**Verified Dump:** **`hzppsttpzzeuslnpcdkv`** (CLI name **CHANTIER**).

| Evidence | Detail |
|---|---|
| CLI link | `supabase/.temp/linked-project.json` |
| Dump artifacts | `migration-analysis/production-dump/` |

**Nhãn:** Verified Dump = hzppst · **Unknown Runtime Production** = VM/secrets / undumped afgveikz.

---

## 3. Vì sao Runtime URL ≠ Dump project?

Quan sát: FE/EAS = afgveikz; CLI = hzppst; credential mở hzppst, không mở afgveikz.  
**Không** đủ để gán staging/prod/clone.

---

## 4. Environment labels

Cả hai project = **Unclassified** (không có evidence staging/dev/archived/cloned/production/sandbox).

---

## 5. Project Inventory

| Project ID | Purpose (observed) | Evidence | Confidence | Current Status | Can Dump? | Used By Runtime? | Used By CI? | Source of Truth? |
|---|---|---|---|---|---|---|---|---|
| `afgveikzneaablcuzwdb` | Committed FE/EAS URL | `app.config.js`, `eas.json` | High (URL) | Dump failed this session | No (session) | Yes (committed defaults) | Unknown (secrets) | No |
| `hzppsttpzzeuslnpcdkv` | CLI-linked; Verified Dump | `.temp`, `production-dump/` | High (dump) | Dump OK | Yes | No evidence in FE hardcodes | Unknown | No (Verified Dump only) |
| CI secrets URL | Deploy inject | `deploy.yml` secrets | Unknown | Opaque | Unknown | Unknown | Yes | Unknown |

---

## 6. Source of Truth map

| Layer | Current | Notes |
|---|---|---|
| Current Runtime SoT | Committed = **afgveikz** | Deploy override = Unknown |
| Current Database SoT | **Not promoted** | hzppst = Verified Dump only |
| Current Documentation SoT | **`migration-analysis/`** from **65 migrations** (+ Phase 0/1) | Dump notes = supplementary only |
| Confidence Level | See `CONFIDENCE_MATRIX.md` | C05 (Runtime==Dump) ≈ 10% |
| Unknowns | CI secret ref; afgveikz dumpability; env class |
| Assumptions | **None** accepted as Production SoT |
| Blocked Decisions | Promote hzppst; close Phase 2 as prod; Backend parity DB; Phase 3 start |

---

## 7. Gate rules

| Action | Allowed? |
|---|---|
| Kết luận hzppst = production | **No** |
| Promote Dump → Database SoT | **No** until Scenario B (or dump confirms A/C) |
| Update Master Plan Phase 2 → Done | **No** until Gate |
| Update migration-readiness as prod | **No** until Gate |
| Keep Verified Dump artifacts | **Yes** |
| Status: Technical Investigation Complete · Waiting External Confirmation | **Yes** |

Next steps after human input: `plan/plan/NEXT_ACTION_MATRIX.md`.

---

## 8. Backend design basis (current)

**D) Chưa đủ bằng chứng** — see Confidence Matrix C15.

Unblock: confirm Runtime ref → Scenario A/B/C → close Phase 2 Gate → then Phase 3.

---

## ADDENDUM — Consolidation + Replatforming (2026-07-14)

**Project goal changed.** This file’s original “Production SoT = one runtime DB” framing is **historical** for Phase 2 investigation.

### New SoT chain

```
Legacy Sources (FE A/B, Supabase A/B, dumps, migrations)
        ↓
Merge Specification          ← design SoT for consolidation
        ↓
Unified Domain Model
        ↓
Unified Backend              ← runtime SoT (application)
        ↓
Unified PostgreSQL           ← persistence SoT
```

- Supabase projects (including `afgveikz` / `hzppst`) = **Legacy evidence**, not Unified Backend SoT.
- Phase 2 Waiting External Confirmation remains useful to **label** which ref is which environment/system — it does **not** block defining Consolidation roadmap.
- **Next design phase:** Merge Specification (`plan/plan/phases/phase_03_merge_specification/`).
- System B must be identified; workspace RE to date ≈ candidate **System A** only.

See Master Plan `00_README_EXECUTION.md` and `AGENTIC_FLOW_REFACTOR_REPORT.md`.

