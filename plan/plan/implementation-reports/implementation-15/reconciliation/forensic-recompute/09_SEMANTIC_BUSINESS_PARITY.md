# 09 — Semantic Business Parity

| Question | Answer | Evidence |
|----------|--------|----------|
| Can the same chantier be reconstructed? | **PARTIALLY** | Core attributes (code, nom, adresse, dates, actif) MATCH. Schedule semantics are CAPABILITY_LOSS (single window → forced matin/apres_midi). |
| Can the same declaration be reconstructed? | **PARTIALLY** | Hour counts and statut MATCH. commentaire column absent (CAPABILITY_LOSS); currently all comments empty so no LOST values observed. |
| Can the same work period be reconstructed? | **PARTIALLY** | Date/hours/statut/flags MATCH (panier renamed). GPS reduced to one point; commentaire absent. |
| Can GPS history be reconstructed? | **NO** | Destination stores one (lat,lng). End point cannot be represented. Current data has end==start so numeric loss not observed, but history model is destroyed (CAPABILITY_LOSS). |
| Can comments be reconstructed? | **NO** | No commentaire columns in local periodes_travail or declarations_heures. Empty today ≠ preservable tomorrow. |
| Can schedule semantics be reconstructed? | **NO** | Source single window mapped into four-slot morning/afternoon model with invented NULL afternoon start and duplicated fin. |
| Can identity be reconstructed? | **PARTIALLY** | 9 merged profiles load; joseph.ad collision discarded hzppst identity fields (nom, matricule, phone, created_at, updated_at). |
| Can every user log in? | **NO — LOST_AUTHENTICATION** | Original Supabase password hashes / identities absent from dumps. ETL generated temporary bcrypt hashes. Original credentials cannot authenticate. |
| Can every business action be replayed? | **NO** | Timesheet numeric actions mostly replayable; auth, discarded identity attributes, GPS end model, comments model, and schedule model prevent faithful full replay. |
