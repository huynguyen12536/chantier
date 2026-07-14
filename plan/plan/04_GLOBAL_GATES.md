# Global Quality Gates — Chantier (Consolidation + Replatforming)

## G0: Planning Ready

- [x] Master Plan Consolidation `00_README_EXECUTION.md` (Phase 0–14 redesigned from P3)
- [x] Legacy Analysis `migration-analysis/` (System A / workspace)
- [x] Framework files `01`–`08`, templates, tracking
- [x] Backend scaffold `api-chantier/` (+ Docker) — **not** Architecture Done
- [ ] Legacy B identified (or Decision Log exception) — Gate for Phase 3
- [ ] Merge Specification approved — Gate for Unified Design

## G1: Task Done

- [ ] Acceptance criteria met (evidence attached)
- [ ] Required reviews completed
- [ ] No unresolved Critical/High findings
- [ ] Claims về legacy cite `migration-analysis/…` hoặc Merge Spec
- [ ] `tracking/status_board.md` updated (Evidence Link filled)
- [ ] Task Type executed đúng (không Implementation khi task là Analysis)
- [ ] Không “clone Supabase” / 1:1 migrate disguised as Done

## G2: Phase Done

- [ ] All tasks in phase Done
- [ ] Phase Acceptance Criteria trong Master Plan đạt
- [ ] Integration check trong scope phase
- [ ] Risks liên quan cập nhật `05_RISK_REGISTER.md` nếu phát sinh mới

### Phase-specific extras

| Phase | Extra gate |
|---|---|
| 2 (historical) | Dump labeled; Runtime==Dump unproven until confirmation — **Legacy evidence only** |
| 3 Merge Spec | schema/rules/triggers/functions/RPC/Edge/auth/permissions/storage/realtime/data maps + conflict register signed |
| 5 Unified DB | Target DDL covers A∪B decisions; tenancy explicit |
| 6 Logic | Keep/Port/Drop for A∪B inventories |
| 7 Backend Architecture | ADR covers Auth/AuthZ/RPC/Triggers/Edge replacement — not PostgREST clone |
| 9 API Contract | No Supabase client assumed; unified FE contracts |
| 11 Data migration | Identity merge + FK + A-only/B-only rules |
| 13 Cutover | Supabase A/B write paths disabled or sequenced freeze + rollback |

## G3: Production / Cutover (Unified)

- [ ] Secrets không trong image/repo public
- [ ] Unified DB không expose public không cần thiết
- [ ] TLS / firewall theo task deploy
- [ ] Rollback plan đã test / documented
- [ ] Dual-legacy split-brain avoided
- [ ] Hypercare owner chỉ định

---

**Không** Done Phase 7/9/10 chỉ vì có skeleton `501` routes.  
**Không** Done Consolidation chỉ vì reverse-engineer được **một** Supabase.
