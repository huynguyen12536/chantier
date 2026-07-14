# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Target ER (conceptual)

```text
profiles ──< affectations_chantiers >── chantiers
profiles ──< periodes_travail >──────── chantiers
profiles ──< declarations_heures >───── chantiers
declarations_heures ──< approval_audit_events
zones_equipe ──< zones_chantiers >──── chantiers
zones_equipe ──< zones_ouvriers >───── profiles
```

`periodes_travail` and `declarations_heures` remain separately represented because the CVL has both capture and review paths. Their synchronization is application-owned (Phase 6), not a target trigger contract.
