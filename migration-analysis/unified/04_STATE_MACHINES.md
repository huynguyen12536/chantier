# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# State machines

## Work period
`recorded/terminee → submitted-equivalent → validated | rejected | cancelled`

The exact CVL period labels and transitions remain contract/evidence references. A Unified Platform transition must be authorized, audited, and coordinated by the Review & Approval write path; it may not recreate competing frontend/trigger writes.

## Hours declaration
`draft or derived → soumise → validee | rejetee | annulee`

- `soumise` is reviewable.
- `validee` and `rejetee` record reviewer identity/time where CVL does.
- `annulee` reconciles affected periods according to Soft Annulee policy (**DR-IMP06-001** — no hard DELETE).
- Auto-approval preserves matching-shift condition and **must** set `validated_by` + `validated_at` (**DR-IMP06-003**).
- Hours synthesis uses **CADRE** when chantier hours configured; else 7h (**DR-IMP06-002**).

Unknown Pending Legacy states are adapter candidates and must be mapped before activation.
