# 03 — Field Trace (end-to-end)

Classification uses worst observed class per `stage|table|field`.  
**UUID/FK/row-count equality alone never yields MATCH.**

## Classification tallies (unique field keys)

| Class | Unique fields |
|-------|---------------|
| CAPABILITY_LOSS | 4 |
| GENERATED | 3 |
| DEFAULTED | 1 |
| TRANSFORMED | 7 |
| MATCH | 100 |

## Trace by stage/table

### source_to_merged :: profiles

| Field | Class | Note |
|-------|-------|------|
| created_at | **MATCH** |  |
| email | **MATCH** |  |
| id | **MATCH** |  |
| matricule | **MATCH** |  |
| nom | **MATCH** |  |
| phone | **MATCH** |  |
| prenom | **MATCH** |  |
| role | **MATCH** |  |
| updated_at | **MATCH** |  |

### source_to_merged :: chantiers

| Field | Class | Note |
|-------|-------|------|
| actif | **MATCH** |  |
| adresse | **MATCH** |  |
| code | **MATCH** |  |
| created_at | **MATCH** |  |
| date_debut | **MATCH** |  |
| date_fin | **MATCH** |  |
| heure_debut | **MATCH** |  |
| heure_fin | **MATCH** |  |
| id | **MATCH** |  |
| nom | **MATCH** |  |

### source_to_merged :: affectations_chantiers

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| chef_equipe_id | **MATCH** |  |
| created_at | **MATCH** |  |
| date_debut | **MATCH** |  |
| date_fin | **MATCH** |  |
| id | **MATCH** |  |
| user_id | **MATCH** |  |

### source_to_merged :: periodes_travail

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| commentaire | **MATCH** |  |
| created_at | **MATCH** |  |
| date | **MATCH** |  |
| deplacement | **MATCH** |  |
| from_suggestion | **MATCH** |  |
| heure_debut | **MATCH** |  |
| heure_fin | **MATCH** |  |
| id | **MATCH** |  |
| latitude_debut | **MATCH** |  |
| latitude_fin | **MATCH** |  |
| longitude_debut | **MATCH** |  |
| longitude_fin | **MATCH** |  |
| panier_repas | **MATCH** |  |
| statut | **MATCH** |  |
| updated_at | **MATCH** |  |
| user_id | **TRANSFORMED** | FK remapped 00ff4c88-626c-44a3-93b2-e6964af2ad73 → 1200f3b8-b1d0-44ea-a75d-60f10993477b |
| validated_at | **MATCH** |  |
| validated_by | **TRANSFORMED** | FK remapped 00ff4c88-626c-44a3-93b2-e6964af2ad73 → 1200f3b8-b1d0-44ea-a75d-60f10993477b |

### source_to_merged :: declarations_heures

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| commentaire | **MATCH** |  |
| created_at | **MATCH** |  |
| date | **MATCH** |  |
| from_suggestion | **MATCH** |  |
| heures_normales | **MATCH** |  |
| heures_supplementaires | **MATCH** |  |
| id | **MATCH** |  |
| nb_deplacements | **MATCH** |  |
| nb_paniers | **MATCH** |  |
| statut | **MATCH** |  |
| updated_at | **MATCH** |  |
| user_id | **TRANSFORMED** | FK remapped 00ff4c88-626c-44a3-93b2-e6964af2ad73 → 1200f3b8-b1d0-44ea-a75d-60f10993477b |
| validated_at | **MATCH** |  |
| validated_by | **TRANSFORMED** | FK remapped 00ff4c88-626c-44a3-93b2-e6964af2ad73 → 1200f3b8-b1d0-44ea-a75d-60f10993477b |

### merged_to_local :: profiles

| Field | Class | Note |
|-------|-------|------|
| actif | **DEFAULTED** |  |
| created_at | **MATCH** |  |
| email | **MATCH** |  |
| matricule | **TRANSFORMED** | "" → NULL |
| nom | **MATCH** |  |
| password_hash | **GENERATED** |  |
| phone | **MATCH** |  |
| prenom | **MATCH** |  |
| role | **MATCH** |  |
| updated_at | **GENERATED** | Import/trigger overwrote source updated_at |

### merged_to_local :: chantiers

| Field | Class | Note |
|-------|-------|------|
| actif | **MATCH** |  |
| adresse | **MATCH** |  |
| code | **MATCH** |  |
| created_at | **MATCH** |  |
| date_debut | **MATCH** |  |
| date_fin | **MATCH** |  |
| heure_debut/heure_fin → matin/apres_midi | **CAPABILITY_LOSS** | Observed ETL mapping: 07:30:00–16:30:00 → matin(07:30:00–16:30:00) apres_midi(null–16:30:00); mapping applied=true |
| nom | **MATCH** |  |
| updated_at | **GENERATED** |  |

### merged_to_local :: affectations_chantiers

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| chef_equipe_id | **MATCH** |  |
| created_at | **MATCH** |  |
| date_debut | **MATCH** |  |
| date_fin | **MATCH** |  |
| user_id | **MATCH** |  |

### merged_to_local :: periodes_travail

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| commentaire | **CAPABILITY_LOSS** | Empty today; destination has no commentaire column |
| created_at | **MATCH** |  |
| date | **MATCH** |  |
| deplacement | **MATCH** |  |
| from_suggestion | **MATCH** |  |
| heure_debut | **MATCH** |  |
| heure_fin | **MATCH** |  |
| latitude_debut/longitude_debut→latitude/longitude | **TRANSFORMED** | Start point preserved under renamed columns |
| latitude_fin/longitude_fin | **CAPABILITY_LOSS** | End equals start in current data; schema still cannot represent two points |
| panier_repas→panier | **TRANSFORMED** |  |
| statut | **MATCH** |  |
| updated_at | **MATCH** |  |
| user_id | **MATCH** |  |
| validated_at | **MATCH** |  |
| validated_by | **MATCH** |  |

### merged_to_local :: declarations_heures

| Field | Class | Note |
|-------|-------|------|
| chantier_id | **MATCH** |  |
| commentaire | **CAPABILITY_LOSS** | Empty today; destination has no commentaire column |
| created_at | **MATCH** |  |
| date | **MATCH** |  |
| from_suggestion | **MATCH** |  |
| heures_normales | **MATCH** |  |
| heures_supplementaires | **MATCH** |  |
| nb_deplacements | **MATCH** |  |
| nb_paniers | **MATCH** |  |
| statut | **MATCH** |  |
| updated_at | **MATCH** |  |
| user_id | **MATCH** |  |
| validated_at | **MATCH** |  |
| validated_by | **MATCH** |  |

## Explicit non-MATCH guarantees

- Authentication credentials: never MATCH (absent from dumps).
- `commentaire`: never MATCH to local (column missing) — CAPABILITY_LOSS / LOST.
- GPS end point: never MATCH as distinct stored value — CAPABILITY_LOSS / LOST.
- Schedule model: never MATCH — CAPABILITY_LOSS.
