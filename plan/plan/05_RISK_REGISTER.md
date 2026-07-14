# Risk Register — Chantier

> Cập nhật khi phát hiện risk lúc làm task.  
> Nguồn: Legacy Analysis + Consolidation risks (schema/rule/auth/data merge).  
> Project: **Consolidation + Replatforming** (2026-07-14).

| Risk ID | Risk | Likelihood | Impact | Mitigation | Owner Agent | Status |
|---|---|---|---|---|---|---|
| R-01 | Bỏ triggers trước khi BE parity → declarations/export gãy | High | Critical | Port sync services; dual-run; tắt trigger chỉ khi tests xanh | Backend Architect | Open |
| R-02 | Schema SoT (migrations) ≠ production (wave A+B) | High | High | Phase 2 dump CLI + diff; tin dump | Database Optimizer | Open |
| R-03 | SECURITY DEFINER / RLS bypass không được replicate đúng authZ | High | Critical | Permission matrix từ `rls-analysis.md`; Security review | Security Engineer | Open |
| R-04 | Auto-approve không set `validated_by` (audit kém) | Medium | Medium | Port có `validated_by`; product sign-off | Backend Architect | Open |
| R-05 | Drift `nb_deplacements` (sync không ghi cột) | Medium | Medium | Reconcile + fix write path | Database Optimizer | Open |
| R-06 | Nhầm 2 project refs là dual-DB Super Admin | Medium | High | **Mitigated Phase 1:** chốt afgveikz runtime; hzppst = CLI/`env` notes; decision_log 2026-07-14 | Software Architect | Mitigated |
| R-07 | Scope creep Super Admin / multi-company (Flow H) | Medium | High | Out of Scope trừ decision_log mở; single-tenant first; **P1_T03 confirm** | Product Manager | Open (watched) |
| R-08 | Anon key / secrets hardcode FE | High | High | Secret management; gỡ trước prod FE; Phase 1: anon hardcoded `app.config.js`/`eas.json` + file `env` chứa **service_role** dưới tên ANON | Security Engineer | Open (elevated) |
| R-09 | Dual validate FE + trigger → race / double-write | Medium | Medium | Một write path Backend (Phase 6–9) | Backend Architect | Open |
| R-10 | Realtime `postgres_changes` mất khi cắt Supabase | Medium | Medium | Poll/SSE/WS design Phase 7/9; inventory: timesheet, validation, chef-dashboard (P1) | Frontend Developer | Open |
| R-11 | Coi Docker scaffold = Architecture Done → nhảy cóc | Medium | High | Gates Phase 7 ADR bắt buộc; Merge Spec trước | Software Architect | Open |
| R-12 | Xóa user/zone RESTRICT / cascade chantier sai thứ tự | Medium | High | Port Edge + `delete_chantier_cascade` với tests | Backend Architect | Open |
| R-13 | Copy file `env` → `.env` trỏ sai project (hzppst) hoặc dùng service_role trên client | Medium | Critical | Không commit `.env`; xóa/redact `env` secrets; document Phase 1 matrix; rotate keys | Security Engineer | Open |
| R-14 | Production VM URL project ref unknown (CI secrets) | Medium | High | Waiting External Confirmation; NEXT_ACTION_MATRIX Scenarios A–C | Software Architect | Open — Waiting External Confirmation |
| R-15 | Live sync/view/FK on hzppst **cũ hơn** repo (candidate only until Runtime confirmed) | High | High | Do not lock Backend parity until Scenario A/B/C | Product Manager | Open |
| R-16 | `schema_migrations` only 5 rows on hzppst dump | High | Medium | Use dump inventory after labeling; re-check on confirmed legacy DB | Database Optimizer | Open |
| R-20 | **Schema divergence** A vs B | High | Critical | Merge Spec schema_mapping + conflict_register | Database Optimizer | Open |
| R-21 | **Business rule conflicts** A vs B | High | Critical | Merge Spec rules map; Product decide winner/unify | Product Manager | Open |
| R-22 | **Trigger conflicts** A vs B | High | Critical | Merge Spec triggers_mapping; single write-path in Phase 6 | Backend Architect | Open |
| R-23 | **Function / RPC conflicts** | High | High | Merge Spec functions_rpc_mapping | Backend Architect | Open |
| R-24 | **Auth conflicts** (providers, hooks, password) | High | Critical | Merge Spec auth_mapping; Security review | Security Engineer | Open |
| R-25 | **Permission / RLS conflicts** | High | Critical | Merge Spec permissions_mapping; fail-closed unified AuthZ | Security Engineer | Open |
| R-26 | **Data merge conflicts** / inconsistent rows | High | Critical | data_merge_mapping + reconcile plan Phase 11 | Database Optimizer | Open |
| R-27 | **Duplicate identities** (same human/email across A/B) | High | Critical | Identity merge rules; manual review queue | Security Engineer | Open |
| R-28 | **Foreign key conflicts** after merge | High | High | Unified DDL + ETL order | Database Optimizer | Open |
| R-29 | **Migration rollback** incomplete for dual-legacy cutover | Medium | Critical | Phase 8/13 runbooks; PITR | DevOps Automator | Open |
| R-30 | **Data integrity** post-merge (counts, soft-cancel, hours) | High | Critical | Reconcile gates; testing strategy Phase 12 | API Tester | Open |
| R-31 | **Tenant isolation** mistakes if multi-company slips in | Medium | Critical | Architecture Scope + Merge Spec tenancy decision | Security Engineer | Open |
| R-32 | **Pending Legacy Discovery** evidence is absent; future source schema, identity, rules, permissions, and data may require a Merge Decision before inclusion | High | High | Maintain separate evidence intake, source provenance, mapping, identity review, reconciliation baseline, and explicit Merge Decision; do not infer behavior | Product Manager | Open — Deferred (O3); residual for implementation wave |
| R-33 | Treating Consolidation as **clone Supabase / 1:1 migrate** | Medium | High | Master Plan goal; ADR reviews | Software Architect | Open |
| R-34 | Backend changes break **Frontend Frozen Contract** | High | Critical | FE contract matrix in Merge Spec; Contract change = Reject/DR | Backend Architect | Open |
| R-35 | Skipping phase pipeline / Auto-Continue without Quality Gates | Medium | High | Execution Manual; status board checklist | Software Architect | Open |
| R-36 | Env/ref drift afgveikz vs hzppst unresolved at cutover | High | High | Track L labeling; Conflict Matrix Expected Change | Database Optimizer | Open |
| R-37 | Prematurely marking Wave 1 planning or a Wave 2 module **Done** without executable code and pipeline evidence | Medium | Critical | Separate Wave 1 planning completion from Wave 2 coding; require module reports, tests, review, validations, commit, push, and recorded SHA | Technical Director | Open |
| R-38 | Wave 2 implementation breaks the frozen frontend contract | High | Critical | Treat `fe_contract_matrix.md` as a compatibility gate; add adapter/contract tests; require a Decision Request for any incompatibility and never edit `chantier1/` | Backend Architect | Open |


**Residual implementation-wave risks:** R-01–R-05, R-08–R-16, R-20–R-38 remain open until implementation, rehearsal, security review, and live operational evidence are completed. Documentation PASS does not mitigate them by execution.

## When to add a row

- Phát hiện trong review / test  
- Accept trade-off có rủi ro  
- Blocker > 24h liên quan kỹ thuật
