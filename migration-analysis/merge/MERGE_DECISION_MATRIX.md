# Merge Decision Matrix

| Inventory class | CVL item | Decision | Unified Platform handling | Evidence |
|---|---|---|---|---|
| Trigger | sync declarations from periods | Transform | transactional Time Recording orchestration/domain event; parity required | SUMMARY §8; Flow D |
| Trigger | sync periods from declaration | Transform | Review & Approval orchestration; parity required | SUMMARY §8; Flow E |
| Trigger | auto-approve latest matching shift | Transform | explicit policy service; preserve condition pending drift decision | SUMMARY §5 rule 9 |
| Functions | duration/cadre calculations | Keep/Transform | governed calculation policy/read model; no winner between 7h/cadre yet | SUMMARY §5 rule 10; diff §3 |
| RPC | `delete_chantier_cascade` | Transform | auditable worksite-retirement transaction | Flow B; readiness §2 |
| RPC | commented week auto-approve | Defer | no active FE use; require product decision | Flow G |
| RLS helpers/policies | role and scope policies | Transform | RBAC/scoped authorization matrix; preserve outcomes | `rls-analysis.md` |
| Auth | Supabase email/password + profile role | Keep/Transform | retain contract-facing auth; centralize authorization later | `auth-flow.md` |
| Edge | `create-user`, `delete-user` | Transform | lifecycle services, preserve permission and guards | `auth-flow.md` §3–4 |
| Realtime | periods/declarations subscriptions | Keep as contract / Defer mechanism | support equivalent notifications before FE cutover | FE inventory §194–206 |
| Storage | none | Drop/N/A | no CVL storage migration | FE inventory §186, §196 |

Decision labels are design treatments, not implementation authorization.
