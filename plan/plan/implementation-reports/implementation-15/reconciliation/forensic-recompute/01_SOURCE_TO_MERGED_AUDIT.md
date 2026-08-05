# 01 — Source → Merged Audit

**Auditor:** independent forensic recompute  
**Evidence inputs:** `afgveikz.json`, `hzppst.json`, `merged.json`  
**Method:** replay merge independently; field-compare every source row to merged artifact.  
**Structural row-count equality is recorded but does not imply MATCH.**

## Sources

| Source | Project | Profiles | Chantiers | Affectations | Periodes | Declarations |
|--------|---------|----------|-----------|--------------|----------|--------------|
| A | afgveikz | 5 | 3 | 6 | 31 | 30 |
| B | hzppst | 5 | 3 | 6 | 28 | 27 |
| Merged artifact | — | 9 | 6 | 12 | 59 | 57 |

## Independent merge replay vs artifact

| Table | Replay count | Artifact count | Equal |
|-------|-------------|----------------|-------|
| profiles | 9 | 9 | yes |
| chantiers | 6 | 6 | yes |
| affectations_chantiers | 12 | 12 | yes |
| zones_equipe | 0 | 0 | yes |
| zones_chantiers | 0 | 0 | yes |
| zones_ouvriers | 0 | 0 | yes |
| periodes_travail | 59 | 59 | yes |
| declarations_heures | 57 | 57 | yes |

## Email collisions / discarded profiles

Observed audit events in artifact: [{"type":"profile_email_collision","email":"joseph.ad@arson-concept.ch","discarded_id":"00ff4c88-626c-44a3-93b2-e6964af2ad73","kept_id":"1200f3b8-b1d0-44ea-a75d-60f10993477b","discarded_source":"hzppst"}]

### Collision detail — joseph.ad@arson-concept.ch

| | Discarded (hzppst) | Kept (afgveikz) |
|--|-------------------|-----------------|
| id | `00ff4c88-626c-44a3-93b2-e6964af2ad73` | `1200f3b8-b1d0-44ea-a75d-60f10993477b` |
| nom | Arson | Asron |
| prenom | Joseph | Joseph |
| matricule | USR750160 |  |
| phone | +33234234234 | +33342342354 |
| role | admin | admin |
| created_at | 2026-06-25T06:25:50.653741+00:00 | 2026-06-18T08:38:27.151274+00:00 |

**Field-level losses (classification LOST):**

- `nom`: discarded="Arson" / kept="Asron" — recovery: not present in merged.json
- `matricule`: discarded="USR750160" / kept="" — recovery: not present in merged.json
- `phone`: discarded="+33234234234" / kept="+33342342354" — recovery: not present in merged.json
- `created_at`: discarded="2026-06-25T06:25:50.653741+00:00" / kept="2026-06-18T08:38:27.151274+00:00" — recovery: not present in merged.json
- `updated_at`: discarded="2026-06-25T06:25:50.653741+00:00" / kept="2026-06-18T08:38:27.151274+00:00" — recovery: not present in merged.json

**FK remap:** all hzppst rows referencing discarded id `00ff4c88-626c-44a3-93b2-e6964af2ad73` were remapped to kept id `1200f3b8-b1d0-44ea-a75d-60f10993477b` (TRANSFORMED identity pointer, LOST discarded attributes).

## Authentication at source→merged

Classification: **LOST** (not MATCH).

Neither source dump nor merged contains `auth.users`, identities, provider metadata, or password hashes. Provenance comment in dump script: public tables only.

## Other tables

Non-profile business rows from both sources are present in merged with provenance `_source_project`. No UUID PK collisions observed beyond the profile email collision remap.

Zones tables empty in both sources (0 rows) — nothing to preserve.

## Findings summary (source→merged)

| Class | Count (finding events) |
|-------|------------------------|
| LOST | 7 |
