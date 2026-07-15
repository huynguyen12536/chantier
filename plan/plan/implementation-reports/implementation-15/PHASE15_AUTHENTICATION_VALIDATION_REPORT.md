# PHASE15 — Authentication Validation Report

**Method:** `POST /auth/v1/token?grant_type=password` against `http://localhost:3001`  
**Policy:** Temporary password `Phase15-TempPass!` (see password_report) — hashes unavailable in dump.

| Email | Expected | Result |
|---|---|---|
| joseph.ad@arson-concept.ch | admin login | **PASS** — 200, UUID `1200f3b8-…` |
| jasmine.n@gmail.com | chef_equipe login | **PASS** — 200 |
| jasmine.ad@gmail.com | in merged dump? | **FAIL / N/A** — not in dump; 401 |
| @local.test demo | gone after ETL | **PASS** — 0 rows |

## Password report summary

| Metric | Value |
|---|---:|
| Accounts with reused hash | 0 |
| Accounts with temporary password | 9 |
| Documented in artifact | YES |

## Frontend implication

Users must sign in with **migrated emails** + **temporary password** until real Supabase Auth hashes are imported (out of current artifact scope). Cloud passwords cannot be recovered from public-table dump alone.

**Auth criterion for dump-backed users:** PASS (temp password policy).  
**Literal `jasmine.ad@gmail.com` example from brief:** FAIL (absent from artifact — not invented).
