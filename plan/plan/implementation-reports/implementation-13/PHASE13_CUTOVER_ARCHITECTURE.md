# PHASE13_CUTOVER_ARCHITECTURE.md

**Date:** 2026-07-15  
**Mode:** Design  

---

## 1. Target request path

```
Expo FE (thawed services)
    │  fetch / EventSource
    │  Authorization: Bearer <Imp-02 access JWT>
    ▼
api-chantier mountCompat + /api + /events
    │
    ├─ /auth/v1/*          → Imp-02 authService
    ├─ /functions/v1/*     → Imp-03/11 (existing)
    ├─ /rest/v1/rpc/*      → Imp-04 cascade (existing)
    ├─ /tables|/rest/v1/*  → Imp-03…07 via extended mappers
    ├─ /api/validation/*   → Imp-07 (optional direct FE path)
    └─ /events             → Imp-09 SSE
    ▼
PostgreSQL (local)
```

Jobs remain Imp-10 in-process. No Redis/MinIO/Mail.

---

## 2. Authentication design

| FE behavior today | Design |
|---|---|
| `signInWithPassword` | `POST /auth/v1/token?grant_type=password` body `{email,password}` |
| Auto refresh | Timer / 401 interceptor → `grant_type=refresh_token` |
| `getSession` | Read persisted `{ access_token, refresh_token, user, expires_at }` |
| `onAuthStateChange` | Small FE event emitter in AuthContext after login/logout/refresh |
| `signOut` | Clear store + `POST /auth/v1/logout` with refresh_token |
| Profile | `GET /auth/v1/user` and/or `GET /rest/v1/profiles?id=` |
| Edge Bearer | Same access_token |

**Never** duplicate login/JWT/RBAC in FE beyond transport. Imp-02 remains sole issuer.

---

## 3. Realtime design

| Today | Design |
|---|---|
| `.channel` + `postgres_changes` → reload | `EventSource(`${API}/events?access_token=...`)` or fetch stream with Bearer |
| On event | Call existing `loadWeekEntries` / `loadDeclarations` / chef reload (unchanged) |
| timesheet poll | Keep as backup (**OPTIONAL** thin) |

No Supabase Realtime server. Imp-09 already emits on domain mutations.

---

## 4. Table transport design

Replace `supabase.from(t)` with `api.from(t)` thin helper:

- Maps `.select/.insert/.update/.delete` to HTTP verbs on `/rest/v1/{t}`  
- Supports allow-list query builders: `eq`, `gte`, `lte`, `in`, `order`, `limit`, `maybeSingle`  
- **Unsupported** PostgREST: `.or` string grammar, arbitrary embeds → FE or compat **composer** functions  

### Embed strategy (DR-P13-005=H)

| Pattern | Design |
|---|---|
| `affectations + chantiers(*)` | Compat listAffectations + attach chantiers via Imp-04 get/list map in adapter **or** FE two-call merge |
| `zones_equipe` deep tree | New compat `GET` composer calling Imp-05 zone + link + ouvrier reads (service-level; if missing list-link APIs, FE N+1 using existing write/list surfaces + chantiers/profiles GETs) |
| validation declarations embeds | Composer joins profiles/chantiers after `listDeclarations` |

Prefer **compat composers** for AuthContext/team-management hot paths to limit FE churn; keep composers free of SQL.

---

## 5. Declarations write design (DR-P13-003=A)

```
PATCH /rest/v1/declarations_heures
  body { id, statut, ... }
       ↓ map
Imp-07 approve | reject | return | cancel | decideDeclaration
       ↓
existing Imp-07 TX / audit
```

Forbidden: `UPDATE declarations_heures SET statut` in compat.

---

## 6. Affectations (DR-P13-009=B)

| FE today | Design |
|---|---|
| `.upsert(..., onConflict)` | `.insert` / POST → `assignUser` |
| UPDATE `chef_equipe_id` | POST assignUser with chef field (service ON CONFLICT) |
| soft `date_fin` | existing PATCH → softRemove |

---

## 7. Field mapper — chantiers hours (DR-P13-008=A)

| Direction | Mapping |
|---|---|
| Request FE → service | `heure_debut` → `heure_debut_matin`; `heure_fin` → `heure_fin_matin` (PM null unless later evidence) |
| Response service → FE | expose `heure_debut`/`heure_fin` aliases from matin fields for FE types |

No migration; no Imp-04 service rewrite — **compat mapper only** (or FE type change if Human prefers B).

---

## 8. Storage

None. Do not add MinIO.
