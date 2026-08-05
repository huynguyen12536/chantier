# 10_FINAL_VERDICT.md

**Forensic end-to-end business data audit**  
**Compared at:** 2026-07-16T01:21:43.040Z  
**Evidence chain:** Source A + Source B → merged.json → Local PostgreSQL

---

## FINAL VERDICT

# BUSINESS DATA LOSS

CRITICAL: LOST AUTHENTICATION (9 users); CRITICAL: email-collision discarded differing fields (created_at, id, matricule, nom, phone, updated_at); HIGH: additional CAPABILITY LOSS (GPS model / commentaire column / hours model)

---

## Why structural checks are insufficient

| Check | Result | Proves business preservation? |
|---|---|---|
| Row counts | merged PKs present locally (0 missing business rows) | **NO** |
| UUID equality | matching for all merged business tables | **NO** |
| FK integrity | not used as success criterion | **NO** |

---

## Evidence summary

### CRITICAL
- **LOST AUTHENTICATION:** 9 business users — auth.users not in dumps; local hashes generated.
- **MERGE DISCARD:** email `joseph.ad@arson-concept.ch` — differing fields discarded from B profile:
  - `created_at`: discarded="2026-06-25T06:25:50.653Z" kept="2026-06-18T08:38:27.151Z"
  - `id`: discarded="00ff4c88-626c-44a3-93b2-e6964af2ad73" kept="1200f3b8-b1d0-44ea-a75d-60f10993477b"
  - `matricule`: discarded="USR750160" kept=""
  - `nom`: discarded="Arson" kept="Asron"
  - `phone`: discarded="+33234234234" kept="+33342342354"
  - `updated_at`: discarded="2026-06-25T06:25:50.653Z" kept="2026-06-18T08:38:27.151Z"

### HIGH (capability / model)
- GPS 4→2: CAPABILITY LOSS on all 59 periods (fin==debut in this dump; schema cannot store distinct end).
- commentaire column absent: CAPABILITY LOSS on periods + declarations (0 non-empty in dump).
- Chantier hours model: CAPABILITY LOSS (1 window → 2-slot with null apres start).

### MEDIUM
- profiles.updated_at overwritten at password reset / ETL (GENERATED).
- profiles.actif DEFAULTED true.

### LOW
- System auto-approve profile GENERATED.
- Empty matricule → NULL TRANSFORMED (absent meaning preserved).

---

## Business impact

| Area | Impact |
|---|---|
| Login | Users cannot authenticate with original Supabase passwords |
| Identity merge | joseph.ad lost B-side nom/matricule/phone attributes |
| GPS | End-of-shift location cannot be stored or reconstructed as distinct point |
| Comments | Model cannot hold commentaires |
| Schedule | Cadre morning/afternoon slots not faithful to original single window |

---

## Recovery possibility

- Export Supabase auth.users (both projects) or force password reset with user communication
- Restore discarded hzppst profile attributes for joseph.ad (nom/matricule/phone) from B dump
- ALTER schema for commentaire + GPS fin columns if product requires parity, then re-import
- Document or redesign hours 1-window→2-slot mapping with FE contract

---

## Reports in this pack

1. `01_SOURCE_TO_MERGED_AUDIT.md`
2. `02_MERGED_TO_LOCAL_AUDIT.md`
3. `03_END_TO_END_FIELD_TRACE.md`
4. `04_CRITICAL_DATA_LOSS.md`
5. `05_CAPABILITY_LOSS.md`
6. `06_GENERATED_DATA.md`
7. `07_DEFAULT_VALUE_AUDIT.md`
8. `08_AUTHENTICATION_PARITY.md`
9. `09_SEMANTIC_BUSINESS_PARITY.md`
10. `10_FINAL_VERDICT.md`

**STOP — Await Human Review. No data was modified.**
