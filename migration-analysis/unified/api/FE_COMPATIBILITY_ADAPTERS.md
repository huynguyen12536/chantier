# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Frozen frontend compatibility adapters

| Frozen interaction | Unified Platform compatibility boundary | Constraint |
|---|---|---|
| Password sign-in, refresh, sign-out, session state | JWT/refresh session endpoints plus an adapter response preserving identity/session fields the frontend consumes | Do not alter frontend auth flow. |
| `profiles` table reads/updates | `/tables/profiles` and `/profiles/{id}` policy-backed adapters | Preserve payload keys at the boundary; apply RBAC/scope server-side. |
| Eight CVL table operations | Allow-list table adapters for `profiles`, `chantiers`, `affectations_chantiers`, `periodes_travail`, `declarations_heures`, `zones_equipe`, `zones_chantiers`, `zones_ouvriers` | Not a PostgREST clone; table names/shapes are adapter-only. |
| `create-user`, `delete-user` Edge fetches | `/functions/create-user`, `/functions/delete-user` bearer-compatible endpoints | Preserve CVL authorization and lifecycle guards. |
| `delete_chantier_cascade` RPC | `/rpc/delete_chantier_cascade` transactional command adapter | Preserve cascade semantics and auditability. |
| Period/declaration postgres changes | Authenticated `/events` SSE/WS transport selected during implementation | Equivalent scope and event meaning required before cutover. |

The commented week auto-approve RPC is not an active contract and is not enabled by this pack. There is no CVL storage contract.
