# 09_SEMANTIC_BUSINESS_PARITY.md

**Compared at:** 2026-07-16T01:32:38.937Z

| Question | Answer | Evidence |
|---|---|---|
| Can original user login? | **NO** | LOST AUTHENTICATION × 9; dumps lack auth.users; local auth schema=false |
| Can original chantier be reconstructed? | **PARTIAL** | UUID/code/nom/dates MATCH; hours model CAPABILITY_LOSS (single window not exactly reconstructible as 2-slot) |
| Can work periods be reconstructed? | **PARTIAL** | Core fields MATCH via ::text; GPS fin CAPABILITY_LOSS; commentaire CAPABILITY_LOSS |
| Can declarations be reconstructed? | **PARTIAL** | Numeric/statut MATCH; commentaire CAPABILITY_LOSS |
| Can GPS history be reconstructed? | **NO** | Start+end history not representable (4→2 CAPABILITY_LOSS) even when fin==debut |
| Can comments be reconstructed? | **NO** | commentaire DDL absent — CAPABILITY_LOSS |
| Can schedule semantics be reconstructed? | **NO** | Single continuous heure_debut/heure_fin cannot be exactly reconstructed from forced 2-slot layout with null apres start |
| Can every business action be replayed? | **PARTIAL** | Timesheet/affectation actions partially yes; login with original credentials NO; GPS end/comments/merged identity attributes incomplete |
