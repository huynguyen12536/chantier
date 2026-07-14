# Realtime Mapping

| CVL screen/use | Observed subscription | Unified Platform requirement | Drift note |
|---|---|---|---|
| Timesheet | `periodes_travail`, `declarations_heures` changes | deliver equivalent scoped refresh/event notifications | FE expects both |
| Validation | `declarations_heures`, `periodes_travail` changes | deliver equivalent review-queue updates | FE expects both |
| Chef dashboard | `periodes_travail` changes | deliver equivalent team-pending updates | scoped channel |

Evidence: `frontend-supabase-usage.md` §194–206. The `hzppst` dump has zero tables in `supabase_realtime` while repository migration adds the two tables (`production-vs-repository-diff.md` §10). This is a contract/drift conflict, not proof that realtime can be dropped.
