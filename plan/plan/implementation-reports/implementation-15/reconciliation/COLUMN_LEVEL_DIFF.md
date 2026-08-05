# COLUMN_LEVEL_DIFF.md

**Compared at:** 2026-07-15T15:38:02.126Z

## profiles

Merged: `created_at`, `email`, `id`, `matricule`, `nom`, `phone`, `prenom`, `role`, `updated_at`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| email | text | NO |  |
| password_hash | text | NO |  |
| role | USER-DEFINED | NO |  |
| nom | text | YES |  |
| prenom | text | YES |  |
| matricule | text | YES |  |
| actif | boolean | NO | true |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| phone | text | NO | ''::text |

## chantiers

Merged: `actif`, `adresse`, `code`, `created_at`, `date_debut`, `date_fin`, `heure_debut`, `heure_fin`, `id`, `nom`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| code | text | NO |  |
| nom | text | NO |  |
| adresse | text | YES |  |
| date_debut | date | YES |  |
| date_fin | date | YES |  |
| heure_debut_matin | time without time zone | YES |  |
| heure_fin_matin | time without time zone | YES |  |
| heure_debut_apres_midi | time without time zone | YES |  |
| heure_fin_apres_midi | time without time zone | YES |  |
| actif | boolean | NO | true |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

## affectations_chantiers

Merged: `chantier_id`, `chef_equipe_id`, `created_at`, `date_debut`, `date_fin`, `id`, `user_id`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| chantier_id | uuid | NO |  |
| chef_equipe_id | uuid | YES |  |
| date_debut | date | NO | CURRENT_DATE |
| date_fin | date | YES |  |
| created_at | timestamp with time zone | NO | now() |

## zones_equipe

Merged: `(empty)`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| nom | text | NO |  |
| chef_equipe_id | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |
| description | text | YES |  |

## zones_chantiers

Merged: `(empty)`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| zone_id | uuid | NO |  |
| chantier_id | uuid | NO |  |

## zones_ouvriers

Merged: `(empty)`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| zone_id | uuid | NO |  |
| user_id | uuid | NO |  |
| date_debut | date | NO | CURRENT_DATE |
| date_fin | date | YES |  |

## periodes_travail

Merged: `chantier_id`, `commentaire`, `created_at`, `date`, `deplacement`, `from_suggestion`, `heure_debut`, `heure_fin`, `id`, `latitude_debut`, `latitude_fin`, `longitude_debut`, `longitude_fin`, `panier_repas`, `statut`, `updated_at`, `user_id`, `validated_at`, `validated_by`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| chantier_id | uuid | NO |  |
| date | date | NO |  |
| heure_debut | time without time zone | NO |  |
| heure_fin | time without time zone | YES |  |
| latitude | double precision | YES |  |
| longitude | double precision | YES |  |
| panier | boolean | NO | false |
| deplacement | boolean | NO | false |
| from_suggestion | boolean | NO | false |
| statut | text | NO | 'terminee'::text |
| validated_by | uuid | YES |  |
| validated_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

## declarations_heures

Merged: `chantier_id`, `commentaire`, `created_at`, `date`, `from_suggestion`, `heures_normales`, `heures_supplementaires`, `id`, `nb_deplacements`, `nb_paniers`, `statut`, `updated_at`, `user_id`, `validated_at`, `validated_by`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| chantier_id | uuid | NO |  |
| date | date | NO |  |
| heures_normales | numeric | NO | 0 |
| heures_supplementaires | numeric | NO | 0 |
| nb_paniers | integer | NO | 0 |
| nb_deplacements | integer | NO | 0 |
| from_suggestion | boolean | NO | false |
| statut | text | NO | 'soumise'::text |
| validated_by | uuid | YES |  |
| validated_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

