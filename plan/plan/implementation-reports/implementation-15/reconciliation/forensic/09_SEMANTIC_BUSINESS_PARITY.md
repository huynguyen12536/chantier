# 09_SEMANTIC_BUSINESS_PARITY.md

**Compared at:** 2026-07-16T01:21:43.040Z

| Question | Answer | Evidence | Affected rows | Affected fields |
|---|---|---|---|---|
| Can the same chantier be reconstructed? | **PARTIAL** | All 6 chantier UUIDs present; code/nom/adresse/dates MATCH. Hours model CAPABILITY_LOSS (single window→2-slot). | 6 | ["heure_debut","heure_fin","__hours_model__"] |
| Can the same work period be reconstructed? | **PARTIAL** | All 59 period UUIDs present; date/times/statut/user/chantier MATCH (via ::text). GPS fin CAPABILITY_LOSS; commentaire CAPABILITY_LOSS. | 59 | ["latitude_fin","longitude_fin","commentaire"] |
| Can the same declaration be reconstructed? | **PARTIAL** | All 57 declaration UUIDs present; numeric hours/statuts MATCH. commentaire CAPABILITY_LOSS. | 57 | ["commentaire"] |
| Can the same GPS history be reconstructed? | **NO** | All fin coords equal debut (zeros) in this dump, but schema stores only 1 point — CAPABILITY LOSS; full GPS history (start+end) cannot be reconstructed | 59 | ["latitude_fin","longitude_fin"] |
| Can comments be reconstructed? | **NO** | commentaire column absent from DDL — CAPABILITY LOSS (0 non-empty in dump) | 116 | ["commentaire"] |
| Can every original user log in? | **NO** | LOST AUTHENTICATION for 9 business users; auth.users not reconstructible from dumps; local auth.users=absent | 9 | ["password_hash","auth.users","provider"] |
| Can every business action still be reproduced? | **PARTIAL** | Core timesheet/affectation/chantier rows present with matching business scalars, but auth login, GPS end points, comments, and email-collision profile attributes are not fully reproducible. | n/a | ["auth","GPS fin","commentaire","merge-discarded profile fields"] |
