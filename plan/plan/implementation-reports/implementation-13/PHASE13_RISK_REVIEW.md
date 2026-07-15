# PHASE13_RISK_REVIEW.md

**Date:** 2026-07-15  
**Mode:** Design  

---

## Classification legend

| Class | Meaning |
|---|---|
| **Must implement** | Required for fully runnable local MVP |
| **Can defer** | Product works without; UX/ops gap acceptable |
| **Not required** | Out of CVL / sealed out |

---

## Risks

| Risk | Class | Mitigation in Design |
|---|---|---|
| FE thaw scope creep | Must implement control | File allow-list in Implementation Plan |
| Auth token refresh bugs | Must implement | WP2 tests; 401 interceptor |
| Embed composer incomplete | Must implement | WP5 cases from audit (AuthContext, team, validation) |
| Declaring statut wrong command map | Must implement | Explicit statut→Imp-07 table in tests |
| SSE browser/RN differences | Can defer | Keep timesheet poll; EventSource polyfill |
| Hour mapper wrong for PM cadre | Can defer / Must if FE uses PM | Start matin-only alias; document |
| LAN CORS / device URL | Must implement | Document API_URL LAN; CORS_ORIGIN |
| Seed password leakage in repo | Must implement ops hygiene | Demo-only secrets in docs |
| Removing supabase-js breaks unnoticed import | Must implement | Grep gate in WP8 |
| Imp-08 unused | Can defer | Keep SELECT export path |
| Redis/MinIO invent | Not required | DR-007=A |
| Realtime protocol bridge | Not required | DR-004=A |
| PostgREST clone creep | Must prevent | DR-005=H allow-list |
| Second write path | Must prevent | Code review rule + tests |
| Production cutover/ETL | Not required | Out of Phase 13 |

---

## Prior “BLOCKED” → design disposition

All former P13-B01…B08 are **Must implement** tasks after DR seal (or CRITICAL only until seal). None require new product domains.
