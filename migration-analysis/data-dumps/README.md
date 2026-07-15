# Dual legacy Supabase dumps

Scripts: `dump-and-merge.mjs`

Outputs (gitignored unless force-added for analysis):
- `afgveikz.{json,sql}` — FE/EAS runtime project
- `hzppst.{json,sql}` — CLI-linked CHANTIER project
- `merged.{json,sql}` — provisional merge (+ provenance in JSON)
- `merged_audit.json` — email/UUID collision remaps

## Phase 15 load (local Postgres)

```bash
cd api-chantier
npm run seed:production-import
```

- Offline only — reads `merged.json`; does **not** call live Supabase.
- Wipes current business rows then loads merged UUIDs.
- Passwords: temporary `MIGRATION_TEMP_PASSWORD` (default `Phase15-TempPass!`) when hashes absent.
- Keep `npm run seed:local` for **dev demo only**.

Notes:
- Public tables only via PostgREST service_role (keys in FE `env`).
- Does **not** dump `auth.users` / storage / realtime.
- Merge is provisional analysis ETL — Phase 15 imports that artifact into Unified DB.
