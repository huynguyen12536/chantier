# BUSINESS_PARITY_REPORT.md

**Investigation only — NO data modification**  
**Compared at:** 2026-07-15T15:20:22.071Z  
**Source of Truth:** `merged.json` (A=afgveikz + B=hzppst)  
**Target:** local Postgres `chantier`  
**PG timezone:** UTC  
**Node getTimezoneOffset():** -420 min

---

## FINAL VERDICT

# 3. Partial migration (Some business information lost)

Public-table UUIDs complete and most comparable fields MATCH, but auth credentials not migrated; merge discarded alternate profile attributes; schema drops commentaire + GPS fin (documented). Documented hour/GPS transforms preserve values where applicable.

---

## Critical correction vs prior reconciliation

| Prior claim | Fact |
|---|---|
| Systematic date −1 day = data corruption | **FALSE POSITIVE.** `SELECT date::text` matches merged on **all** rows. Previous script used `Date#toISOString().slice(0,10)` under UTC+7 local offset (−420), producing a phantom −1 day. |
| Migration OK because UUIDs/counts/FKs match | **Insufficient.** Business fidelity requires field + auth + semantic checks (this report). |

### Date probe (periodes_travail sample)

| id | merged | pg date::text | JS Date toISOString().slice(0,10) | artifact? |
|---|---|---|---|---|
| `3b55aa2d…` | 2026-06-26 | 2026-06-26 | 2026-06-25 | YES (false −1d) |
| `fcf5e723…` | 2026-06-24 | 2026-06-24 | 2026-06-23 | YES (false −1d) |
| `24b78a5a…` | 2026-06-23 | 2026-06-23 | 2026-06-22 | YES (false −1d) |

### Date verification counts (`::text` vs merged)

| Table | Column(s) | Rows compared | Mismatches |
|---|---|---:|---:|
| chantiers | date_debut, date_fin | 6 | 0 |
| affectations_chantiers | date_debut, date_fin | 12 | 0 |
| periodes_travail | date | 59 | 0 |
| declarations_heures | date | 57 | 0 |

**Root cause of prior false report:** node-pg DATE → JS Date at local midnight → `toISOString()` UTC conversion.  
**Where:** previous `reconcile-full-readonly.mjs` `asComparable()`.  
**Why:** host TZ UTC+7 (`getTimezoneOffset()=-420`).  
**How many rows actually wrong in DB:** **0**.

---

## Row existence

| Table | A | B | Merged | Local | Missing | Extra |
|---|---:|---:|---:|---:|---:|---:|
| profiles | 5 | 5 | 9 | 10 | 0 | 1 |
| chantiers | 3 | 3 | 6 | 6 | 0 | 0 |
| affectations_chantiers | 6 | 6 | 12 | 12 | 0 | 0 |
| zones_equipe | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_chantiers | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_ouvriers | 0 | 0 | 0 | 0 | 0 | 0 |
| periodes_travail | 31 | 28 | 59 | 59 | 0 | 0 |
| declarations_heures | 30 | 27 | 57 | 57 | 0 | 0 |

### Extra rows
- **profiles**: `00000000-0000-4000-8000-000000000001` — system auto-approve actor (documented)

### Duplicated / collisions

#### profiles
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### chantiers
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### affectations_chantiers
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### zones_equipe
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### zones_chantiers
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### zones_ouvriers
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### periodes_travail
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0

#### declarations_heures
- UUID dup Merged: 0
- UUID dup Local: 0
- UUID collisions A∩B: 0
- Email collisions Local: 0
- Composite key collisions Local: 0


### Field classification totals

| Table | MATCH | TRANSFORMED | LOST | MODIFIED | UNKNOWN |
|---|---:|---:|---:|---:|---:|
| profiles | 71 | 10 | 9 | 9 | 0 |
| chantiers | 48 | 30 | 0 | 0 | 0 |
| affectations_chantiers | 84 | 0 | 0 | 0 | 0 |
| zones_equipe | 0 | 0 | 0 | 0 | 0 |
| zones_chantiers | 0 | 0 | 0 | 0 | 0 |
| zones_ouvriers | 0 | 0 | 0 | 0 | 0 |
| periodes_travail | 767 | 118 | 59 | 0 | 0 |
| declarations_heures | 798 | 0 | 57 | 0 | 0 |

---

## Documented transforms (accepted only if equivalent)

| Transform | Documented rule | Equivalent in this dump? |
|---|---|---|
| Chantier hours | heure_debut → heure_debut_matin; heure_fin → heure_fin_matin AND heure_fin_apres_midi; heure_debut_apres_midi = null | Values kept; semantics of 2-slot day **changed** (matin end = full fin; apres_midi start null) |
| GPS 4→2 | KEEP latitude_debut→latitude, longitude_debut→longitude; DISCARD latitude_fin, longitude_fin | Kept debut; discarded fin. All 59 rows `0,0,0,0` → **no unique coordinate value lost**; ability to store fin **lost** |
| panier_repas→panier | rename | YES |
| commentaire dropped | schema | Column lost; **0 non-empty** values in dump |
| password_hash synthetic | ETL + ops reset | **NOT equivalent to Supabase auth** — never SAFE |
| profiles.actif default true | COALESCE | New column; all true |
| phone COALESCE '' | ETL | No NULL phones in merged |
| system actor | platform | Extra profile expected |
| email collision keep-A | dump-and-merge | B profile attributes discarded (see below) |

### Email collision — discarded business attributes

- `joseph.ad@arson-concept.ch`.`nom`: discarded=`Arson` kept=`Asron`
- `joseph.ad@arson-concept.ch`.`matricule`: discarded=`USR750160` kept=``
- `joseph.ad@arson-concept.ch`.`phone`: discarded=`+33234234234` kept=`+33342342354`
- `joseph.ad@arson-concept.ch`.`created_at`: discarded=`2026-06-25T06:25:50.653741+00:00` kept=`2026-06-18T08:38:27.151274+00:00`
- FK remap: periodes user_id remapped **3**, declarations **3** → kept id `1200f3b8-b1d0-44ea-a75d-60f10993477b`

---

## Auth migration

| Metric | Count |
|---|---:|
| Business users impossible with original Supabase password | 9 |
| Users with synthetic / reset hash (temporary or ops) | 9 |
| Users missing password_hash | 0 |
| Profiles only in merged (not local) | 0 |
| Local-only non-system | 0 |

- reset-passwords-123456.js exists and profiles.updated_at all share 2026-07-15T14:53:42Z — ops likely overwrote ETL temp hashes after import.
- auth.users / auth.identities never extracted from either Supabase project.
- No auth provider metadata (email/password vs OAuth) available in dumps.

ETL temp policy (at import): `Phase15-TempPass!` — **not SAFE**; documents intentional synthetic credentials.

### Auth user list

| id | email | role | actif | hash | in_merged | class |
|---|---|---|---|---|---|---|
| 00000000-0000-4000-8000-000000000001 | system.auto-approve@platform.local | admin | true | $2b$10$ | false | SYSTEM |
| 47c68c11-eff5-4ba3-9368-252c38d30825 | nguyenthikieunghi.ltp202@gmail.com | admin | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| 1200f3b8-b1d0-44ea-a75d-60f10993477b | joseph.ad@arson-concept.ch | admin | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| aef70554-b535-4408-9407-946db41f772d | jasmine.tl@gmail.com | chef_equipe | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| f7c50816-459c-4a6d-a782-fe498d1988e4 | jasmine.collab@gmail.com | ouvrier | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| abcca969-52ff-40fc-902d-82de4743462f | jasmine.n@gmail.com | admin | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| 5609a530-0e12-4e78-8104-d810cae90075 | joseph.collab@arson-concept.ch | ouvrier | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | la@yahoo.fr | ouvrier | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| eb5d70b5-0e89-49df-8254-01eaaf25ad3e | ap@gmail.com | ouvrier | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |
| 1d5ac48f-9eae-452a-a998-1b480f87ce18 | joseph.tl@arson-concept.ch | chef_equipe | true | $2b$10$ | true | TEMP_OR_RESET_HASH / original login IMPOSSIBLE |

---

## Semantic equality

| Question | Answer | Caveat |
|---|---|---|
| Can the same chantier be opened? | YES — all 6 chantier UUIDs present; codes/noms match | Hours model transformed 1-window→2-slots (documented). Dates MATCH when read as calendar ::text. |
| Can the same declaration be validated? | YES for row identity / statut / hours amounts (verify field report) | commentaire column absent; dates MATCH (::text). |
| Can the same work period be reconstructed? | MOSTLY — times/statut/user/chantier preserved | GPS end coordinates discarded by schema; in this dump all GPS values are 0 so no unique coordinate lost. commentaire dropped. |
| Can GPS history be reconstructed? | NO (schema) / YES for unique values in this dump | 4 coordinates → 2 (debut only). All 59 rows have debut=fin=0,0 — discarded fin equals kept debut; unique info loss = 0 for this dump, capability loss remains. |
| Can comments be reconstructed? | NO — column not in target schema | Merged dump has 0 non-empty commentaires on periods and declarations — no text payload lost today; schema cannot store future comments from source shape. |
| Can every business user authenticate with their Supabase password? | NO | auth.users never migrated. All 9 business profiles have synthetic bcrypt. Original passwords unrecoverable from artifacts. |
| Is local a complete business merge of BOTH Supabase DBs? | PARTIAL | Row coverage of merged public tables is complete, but (1) auth secrets lost, (2) email-collision discarded B profile fields (nom/matricule/phone), (3) schema transforms drop commentaire + GPS fin, (4) hours semantics changed. |

---

## Hidden data loss / default corruption summary

- Hidden loss findings (non-empty / unexpected): **0**
- Default-corruption findings: **18** (password synthetic = all business profiles)
- Unexpected non-timestamp MODIFIED fields: **0**

FK orphans local: **0**

---

## Artifacts

- `DATE_VERIFICATION.md` — timezone false-positive analysis  
- `FIELD_BY_FIELD_PARITY.md` — every UUID × every field status  
- `AUTH_DATA_AUDIT.md` — auth fidelity  
- `DATA_LOSS_REPORT.md` — losses / corruption  
- `TABLE_BY_TABLE_DIFF.md` / `COLUMN_LEVEL_DIFF.md` / PK & FK audits  

**STOP — Await Human Review. No ETL repair executed.**
