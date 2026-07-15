# IMP12_WAVE_B_CAPABILITY_MATRIX.md

**Date:** 2026-07-15  
**Status:** **FINAL** — Wave B **DELIVERED**; Imp-12 **COMPLETE**  
**Runtime head:** `d8bb5c83c0`  
**Rule:** Wave A rows omitted (already delivered). Classes reflect sealed DR outcomes.

---

## Legend

| Class | Meaning |
|---|---|
| **DELIVERED** | Implemented at Wave B code head |
| **DEFERRED (DR)** | Intentionally omitted by sealed Wave B DR |
| OUT OF SCOPE | Not Imp-12 responsibility |
| Wave A | Delivered in Wave A |

---

## Matrix

| ID | Capability | Adapter shape | Unified target | Service reuse | Class |
|---|---|---|---|---|---|
| WB-T-C | chantiers CRUD (no row DELETE) | `/tables` + `/rest/v1` | `/api/chantiers` | Imp-04 | **DELIVERED** (B-001=A) |
| WB-T-A | affectations | dual mounts | `/api/affectations` | Imp-05 | **DELIVERED** (B-001=A, B-005=B) |
| WB-T-A-U | affectations upsert invent | — | — | — | **DEFERRED (B-005=B)** |
| WB-T-Z1 | zones_equipe | dual | `/api/zones` | Imp-05 | **DELIVERED** |
| WB-T-Z2 | zones_chantiers | dual insert/delete | zone link APIs | Imp-05 | **DELIVERED** |
| WB-T-Z3 | zones_ouvriers | dual insert/patch | zone ouvrier APIs | Imp-05 | **DELIVERED** |
| WB-T-P | periodes_travail | dual allow-list CRUD | `/api/timesheet/periods` | Imp-06 | **DELIVERED** |
| WB-T-D-R | declarations SELECT | dual GET | Imp-06 listDeclarations | Imp-06 | **DELIVERED** (B-003=C) |
| WB-T-D-W | declarations UPDATE statut | — | Imp-07 | Imp-07 | **DEFERRED (B-003=C)** |
| WB-MOUNT | `/rest/v1/{table}` dual | same handlers as `/tables` | Imp-12 mount | Imp-12 | **DELIVERED** (B-002=A) |
| WB-AUTH | Auth `/auth/v1` | thin → Imp-02 | `/api/auth/*` | Imp-02 | **DELIVERED** (B-004=A) |
| WB-RT | Realtime protocol | — | Imp-09 SSE | Imp-09 | **OUT OF SCOPE (B-006=B)** |
| WB-EXP | Export table | — | `/api/export` | Imp-08 | **OUT OF SCOPE** |
| WB-RPC2 | Auto-approve week RPC | — | — | — | **OUT OF SCOPE** |
| WB-SA | Super Admin | — | — | — | **OUT OF SCOPE** |

---

## Ownership (unchanged)

| Adapter | Must not | Avoid by |
|---|---|---|
| periods | Implementing sync in adapter | Call Imp-06 service only |
| declarations UPDATE | Raw statut SQL | **Not implemented** (B-003=C); Imp-07 only if later authorized |
| auth | Re-issuing JWT in adapter | Call Imp-02 login/refresh only |

---

## Wave A exclusion (already done)

E-01, E-02, R-01, T-P-01, T-P-02 — Wave A; profiles dual-mounted under B-002.
