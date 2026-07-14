# Production dump artifacts (Phase 2)

Schema-only snapshot of Supabase project **`hzppsttpzzeuslnpcdkv`** (CHANTIER).

| File | Description |
|---|---|
| `01_public_schema.sql` | `pg_dump --schema-only` public |
| `02_auth_schema.sql` | `pg_dump --schema-only` auth |
| `03_inventory.txt` | Structured inventory |
| `04_function_bodies.sql` | Function definitions |
| `05_extra_inventory.txt` | Migrations history, realtime, view |

Diff report: [`../production-vs-repository-diff.md`](../production-vs-repository-diff.md)

**No user/business data dumps** are stored here.
