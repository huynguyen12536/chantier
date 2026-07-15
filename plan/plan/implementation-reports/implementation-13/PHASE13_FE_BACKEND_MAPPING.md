# PHASE13_FE_BACKEND_MAPPING.md

**Date:** 2026-07-15  
**Mode:** Design — transport + mapper catalog (no business redesign)

---

## 1. Auth mapping

| FE surface | HTTP | Backend |
|---|---|---|
| Login | `POST /auth/v1/token?grant_type=password` | Imp-02 `login` |
| Refresh | `POST /auth/v1/token?grant_type=refresh_token` | Imp-02 `refresh` |
| Logout | `POST /auth/v1/logout` | Imp-02 `logout` |
| Me | `GET /auth/v1/user` | Imp-02 `getProfileById` |
| Persist | FE AsyncStorage/SecureStore JSON | — |

---

## 2. Edge / RPC (unchanged paths)

| FE | Compat | Service |
|---|---|---|
| `/functions/v1/create-user` | existing | Imp-03/11 createUser |
| `/functions/v1/delete-user` | existing | Imp-03 deleteUser |
| `rpc delete_chantier_cascade` | existing | Imp-04 cascade |

---

## 3. Table / verb mapping

| Table | FE verb | Compat route | Service |
|---|---|---|---|
| profiles | GET/PATCH | existing Imp-12 | Imp-03/11 |
| chantiers | GET/POST/PATCH | existing + hour mapper DR-008 | Imp-04 |
| affectations | GET/POST/PATCH soft | existing; FE drops upsert | Imp-05 |
| zones_equipe | CRUD | existing + GET composer | Imp-05 |
| zones_chantiers | GET/POST/DELETE | extend GET; writes exist | Imp-05 |
| zones_ouvriers | GET/POST/PATCH | extend GET; writes exist | Imp-05 |
| periodes_travail | CRUD | existing + filter allow-list | Imp-06 |
| declarations_heures | GET | existing | Imp-06 |
| declarations_heures | PATCH | **new** DR-003 → Imp-07 | Imp-07 |

---

## 4. Mapper modules to add (compat only)

| Mapper | Responsibility |
|---|---|
| `chantierHourMapper` | heure_debut/fin ↔ matin fields |
| `embedComposer` helpers | attach chantiers/profiles to lists |
| `declarationDecisionMapper` | statut string → Imp-07 command |
| `postgrestQueryAllowList` | parse `eq/gte/lte/in/order/limit` query params only |
| FE `sessionStore` | token persistence + auth events |

---

## 5. Query allow-list (supported)

**Supported in Phase 13 Design:** `eq`, `gte`, `lte`, `in`, `order`, `limit`, `id` path param, `maybeSingle` semantics.

**FE adjustment required (not supported as PostgREST strings):** raw `.or(...)` filters, `.ilike` search (replace with FE filter or dedicated `q=` param mapped later), arbitrary embed syntax in `select=`.

---

## 6. Realtime mapping

| FE today | Design |
|---|---|
| channel postgres_changes | Imp-09 SSE event → existing reload fn |

---

## 7. Response envelopes

Keep Imp-12 `{ error: string }` for compat errors.  
SSE: Imp-09 existing event JSON.  
Auth: Imp-12 snake_case tokens.
