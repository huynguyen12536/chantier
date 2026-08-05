# 06 — Generated Data

Values introduced by ETL / platform, not present as business source facts.

| Location | Occurrences | Evidence |
|----------|-------------|----------|
| profiles._row | 1 | System actor system.auto-approve@platform.local present in local, absent from merged |
| profiles.updated_at | 9 | Source updated_at "2026-06-19T02:54:59.7737+00:00" overwritten at import to "2026-07-15T14:53:42.410Z" |
| profiles.password_hash | 9 | bcrypt hash present locally ($2b$10$…) but absent from merged — temporary password assigned by ETL |
| chantiers.updated_at | 6 | merged has no updated_at; local=Tue Jun 23 2026 10:37:45 GMT+0700 (Indochina Time) |

## Categories

1. **password_hash** — bcrypt of `MIGRATION_TEMP_PASSWORD` for every business profile.
2. **system.auto-approve@platform.local** — platform actor row.
3. **chantiers.updated_at** — written because merged chantiers lack updated_at.
4. **profiles.updated_at** — source timestamps overwritten to a single import timestamp (observed MODIFIED/GENERATED on all 9 business profiles).
