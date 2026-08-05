# 05 — Capability Loss

Evaluates the **information model**, not whether today's values happen to be equal.

## GPS history

- **Classification:** CAPABILITY_LOSS
- **Source model:** periodes_travail.latitude_debut/longitude_debut + latitude_fin/longitude_fin
- **Destination model:** periodes_travail.latitude/longitude (single point)
- **Evidence:** Local DDL has only latitude, longitude. End coordinates cannot be stored as a distinct point.

## Comments on work periods

- **Classification:** CAPABILITY_LOSS
- **Source model:** periodes_travail.commentaire
- **Destination model:** column absent
- **Evidence:** Local columns: id, user_id, chantier_id, date, heure_debut, heure_fin, latitude, longitude, panier, deplacement, from_suggestion, statut, validated_by, validated_at, created_at, updated_at

## Comments on declarations

- **Classification:** CAPABILITY_LOSS
- **Source model:** declarations_heures.commentaire
- **Destination model:** column absent
- **Evidence:** Local columns: id, user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, nb_deplacements, from_suggestion, statut, validated_by, validated_at, created_at, updated_at

## Schedule model

- **Classification:** CAPABILITY_LOSS
- **Source model:** chantiers.heure_debut + heure_fin (single work window)
- **Destination model:** heure_debut_matin/heure_fin_matin/heure_debut_apres_midi/heure_fin_apres_midi
- **Evidence:** ETL mapChantierHours forces single window into matin slots and copies fin into apres_midi fin; morning/afternoon split cannot be reconstructed from source nor faithfully stored from source single-window semantics.

## Authentication model

- **Classification:** CAPABILITY_LOSS
- **Source model:** Supabase auth.users + identities + encrypted_password
- **Destination model:** profiles.password_hash (bcrypt local)
- **Evidence:** Auth schema never extracted. Destination cannot hold original Supabase credential material because it was never available to ETL.

## Supabase audit / identity providers

- **Classification:** CAPABILITY_LOSS
- **Source model:** auth identities, provider metadata, refresh sessions
- **Destination model:** refresh_tokens (empty new system)
- **Evidence:** No migration of auth identities or historical auth sessions.


## Important distinction

Empty `commentaire` today does **not** convert CAPABILITY_LOSS into MATCH.  
Equal GPS start/end today does **not** convert single-point schema into a faithful GPS history model.
