# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Keep / Port / Drop matrix

| CVL item | Decision | Unified owner / treatment | Evidence |
|---|---|---|---|
| Period → declaration sync trigger | Port/Transform | Time Recording orchestration, transactional domain event | Merge decision matrix / Flow D |
| Declaration → period sync trigger | Port/Transform | Review & Approval orchestration | Merge decision matrix / Flow E |
| Matching-shift auto approve trigger | Port/Transform | Explicit approval policy, auditable | Merge decision matrix |
| Duration/cadre calculations | Keep/Transform | Calculation policy/read model; no variant selected | Merge decision matrix |
| `delete_chantier_cascade` RPC | Port/Transform | Auditable worksite-retirement transaction | Flow B |
| Commented week auto-approve RPC | Drop/Defer | Inactive; requires product decision | Flow G |
| RLS helpers/policies | Port/Transform | JWT/RBAC scope policy | Merge decision matrix |
| Email/password + profile roles | Keep/Transform | Authn plus centralized authorization | Merge decision matrix |
| `create-user`, `delete-user` Edge | Port/Transform | Identity lifecycle service | Merge decision matrix |
| Realtime subscriptions | Keep contract / defer mechanism | Notification boundary | Merge decision matrix |
| Storage | Drop/N/A | No CVL storage inventory | Merge decision matrix |
