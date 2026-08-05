# 02 — Merged → Local PostgreSQL Audit

**Evidence inputs:** `merged.json` + live query of local DB `chantier` @ 127.0.0.1:5432  
**ETL reference (mechanism only):** `api-chantier/scripts/etl-production-import.js`

## Row presence (context only — not scored as MATCH)

| Table | Merged | Local | Notes |
|-------|--------|-------|-------|
| profiles | 9 | 10 | +1 GENERATED system actor |
| chantiers | 6 | 6 | |
| affectations_chantiers | 12 | 12 | |
| periodes_travail | 59 | 59 | |
| declarations_heures | 57 | 57 | |

## Business field outcomes (observed)

### Profiles
- Identity fields (email, nom, prenom, role, phone, timestamps): **MATCH** for loaded rows.
- `matricule` empty string → NULL: **TRANSFORMED**.
- `actif` absent in merged → TRUE: **DEFAULTED**.
- `password_hash`: **GENERATED** for all 9 business users (no hash in merged).
- System actor `00000000-0000-4000-8000-000000000001`: **GENERATED** row.

### Chantiers
- Core fields: **MATCH**.
- `heure_debut`/`heure_fin` → matin/apres_midi mapping: **CAPABILITY_LOSS**.
- `updated_at` absent in merged: **GENERATED** locally.

### Periodes
- Core time fields: **MATCH**.
- `panier_repas` → `panier`: **TRANSFORMED**.
- GPS start → `latitude`/`longitude`: **TRANSFORMED** (59/59).
- GPS end: **CAPABILITY_LOSS** (59 end==start; 0 distinct-end LOST).
- `commentaire`: **CAPABILITY_LOSS** (column absent; nonempty lost=0).

### Declarations
- Hour/count/statut fields: **MATCH**.
- `commentaire`: **CAPABILITY_LOSS** (nonempty lost=0).

### Affectations
- Links + date_debut/date_fin: **MATCH** (calendar-day compare).
- ETL *can* COALESCE NULL date_debut to CURRENT_DATE — **not observed** (0 rows).

## Finding event counts

| Class | Count |
|-------|-------|
| LOST_AUTHENTICATION | 9 |
| MODIFIED | 9 |
| GENERATED | 25 |
| DEFAULTED | 9 |
