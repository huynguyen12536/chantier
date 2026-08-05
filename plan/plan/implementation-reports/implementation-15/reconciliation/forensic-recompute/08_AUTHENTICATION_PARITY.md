# 08 — Authentication Parity

## Question

Can every original user authenticate using the original Supabase credentials?

## Answer

**NO.** Classification: **LOST_AUTHENTICATION** (never MATCH).

## Evidence chain

1. Dump script extracts **public tables only** via PostgREST — explicitly excludes `auth.users` / storage / realtime.
2. `afgveikz.json` / `hzppst.json` profile rows: columns = id, email, nom, prenom, matricule, role, created_at, updated_at, phone — **no password hash**.
3. `merged.json` profiles: same — **no password hash**.
4. Local `profiles.password_hash` NOT NULL: ETL calls `hashPassword(MIGRATION_TEMP_PASSWORD)` when hash absent.
5. Observed: **9** business users with GENERATED hashes; **0** reused original hashes.

## What cannot be reconstructed

- `auth.users.encrypted_password`
- `auth.identities` / provider metadata
- Original bcrypt/argon hashes compatible with Supabase Auth
- Historical refresh/session tokens

## Consequence

Users must use the migration temporary password (or a reset). Original credentials are cryptographically unavailable in the migration inputs.
