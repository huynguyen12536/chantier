# DATE_VERIFICATION.md

**Compared at:** 2026-07-15T15:20:22.071Z

## Verdict on dates

**No calendar date corruption in PostgreSQL.**  
All business DATE columns match merged when compared as `column::text`.

## Why the previous report claimed −1 day

| Step | What happened |
|---|---|
| WHERE | `reconcile-full-readonly.mjs` → `asComparable()` for DATE columns |
| HOW | `node-pg` returns `date` as JavaScript `Date` at **local midnight** |
| WHY −1 | Host offset UTC+7 (`getTimezoneOffset()=-420`). Local midnight → ISO UTC previous evening → `toISOString().slice(0,10)` = previous calendar day |
| WHY not ETL | ETL passes ISO date strings into `::date`; `date::text` round-trips correctly |
| HOW MANY rows actually shifted in DB | **0** / 6 chantiers + 12 affectations + 59 periodes + 57 declarations |

## Probe evidence

```json
[
  {
    "id": "3b55aa2d-564c-472b-a416-174e76c4dacc",
    "merged": "2026-06-26",
    "pg_text": "2026-06-26",
    "js_iso": "2026-06-25T17:00:00.000Z",
    "false_slice": "2026-06-25"
  },
  {
    "id": "fcf5e723-8930-43c4-83f7-d0f094412a78",
    "merged": "2026-06-24",
    "pg_text": "2026-06-24",
    "js_iso": "2026-06-23T17:00:00.000Z",
    "false_slice": "2026-06-23"
  },
  {
    "id": "24b78a5a-b456-406a-b41b-e2c0263f12ca",
    "merged": "2026-06-23",
    "pg_text": "2026-06-23",
    "js_iso": "2026-06-22T17:00:00.000Z",
    "false_slice": "2026-06-22"
  }
]
```

## Counts

| Table | Field | Compared | Real mismatches (::text) |
|---|---|---:|---:|
| chantiers | date_debut/fin | 12 field-cells | 0 |
| affectations_chantiers | date_debut/fin | all non-null | 0 |
| periodes_travail | date | 59 | 0 |
| declarations_heures | date | 57 | 0 |

Timestamps (`created_at` / `validated_at`) are separate; profiles.`updated_at` was stamped by password reset (ops), not a DATE cast bug.
