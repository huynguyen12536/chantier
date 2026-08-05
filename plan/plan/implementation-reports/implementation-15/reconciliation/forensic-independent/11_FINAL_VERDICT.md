# 11_FINAL_VERDICT.md

**Independent digital forensics audit**  
**Compared at:** 2026-07-16T01:32:38.937Z  
**Evidence chain:** A + B → merged.json → Local PostgreSQL  
**Prior reports/scripts:** treated as untrusted; all figures recomputed.

---

## FINAL VERDICT

# BUSINESS DATA LOSS

CRITICAL LOST AUTHENTICATION (9 users); CRITICAL identity fields discarded in email collision (matricule, nom, phone); HIGH business facts classified LOST; HIGH CAPABILITY LOSS also present

**Business Preservation Score:** 71.36 / 100  
(Formula in `10_BUSINESS_PRESERVATION_SCORE.md`)

---

## Structural checks (explicitly NOT used as success)

| Check | Observed | Contributes to BPS? |
|---|---|---|
| Row counts | 0 missing merged business PKs | **0** |
| UUID equality | matching for merged tables | **0** |
| FK equality | not used as success proof | **0** |

---

## Critical evidence

### LOST AUTHENTICATION (9)
Original Supabase credentials not recoverable. auth.users absent from dumps. Local auth schema=false.

### Email collision identity loss
- **created_at**: discarded="2026-06-25T06:25:50.653Z" kept="2026-06-18T08:38:27.151Z" [MEDIUM]
- **id**: discarded="00ff4c88-626c-44a3-93b2-e6964af2ad73" kept="1200f3b8-b1d0-44ea-a75d-60f10993477b" [MEDIUM]
- **matricule**: discarded="USR750160" kept="" [CRITICAL]
- **nom**: discarded="Arson" kept="Asron" [CRITICAL]
- **phone**: discarded="+33234234234" kept="+33342342354" [CRITICAL]
- **updated_at**: discarded="2026-06-25T06:25:50.653Z" kept="2026-06-18T08:38:27.151Z" [MEDIUM]

### Capability loss (schema)
- GPS 4→2
- commentaire column absent
- hours single-window → 2-slot

---

## Semantic answers (summary)

- Can original user login? → **NO**
- Can original chantier be reconstructed? → **PARTIAL**
- Can work periods be reconstructed? → **PARTIAL**
- Can declarations be reconstructed? → **PARTIAL**
- Can GPS history be reconstructed? → **NO**
- Can comments be reconstructed? → **NO**
- Can schedule semantics be reconstructed? → **NO**
- Can every business action be replayed? → **PARTIAL**

---

## Recovery possibility

1. Export `auth.users` from both Supabase projects (service role) OR force password reset with communication.
2. Restore discarded hzppst profile fields for `joseph.ad@arson-concept.ch` (nom/matricule/phone) from B dump.
3. If product requires parity: ALTER for `commentaire` + GPS fin columns; re-import.
4. Document accepted hours semantic change OR store original window columns.

---

## Report index

1. 01_SOURCE_TO_MERGED_AUDIT.md  
2. 02_MERGED_TO_LOCAL_AUDIT.md  
3. 03_END_TO_END_FIELD_TRACE.md  
4. 04_CRITICAL_DATA_LOSS.md  
5. 05_CAPABILITY_LOSS.md  
6. 06_GENERATED_DATA.md  
7. 07_DEFAULT_VALUE_AUDIT.md  
8. 08_AUTHENTICATION_PARITY.md  
9. 09_SEMANTIC_BUSINESS_PARITY.md  
10. 10_BUSINESS_PRESERVATION_SCORE.md  
11. 11_FINAL_VERDICT.md  

**STOP — Await Human Review. No data modified.**
