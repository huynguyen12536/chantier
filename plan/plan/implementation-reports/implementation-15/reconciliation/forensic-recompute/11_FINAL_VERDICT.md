# 11 — Final Verdict

## Verdict

**MATERIALLY_DEGRADED** — business information is **not** fully preserved.

**Business preservation score: 52/100** (recomputed; not inherited).

## Evidence-only basis

1. **Authentication is LOST** for every original user (auth never dumped; temp hashes GENERATED).
2. **Identity collision LOST** attributes for `joseph.ad@arson-concept.ch` (phone, matricule, nom spelling, timestamps differ between sources; hzppst side discarded).
3. **GPS history model CAPABILITY_LOSS** (two points → one point), regardless of current end==start values.
4. **Comments model CAPABILITY_LOSS** (columns removed), regardless of current emptiness.
5. **Schedule model CAPABILITY_LOSS** (single window → forced morning/afternoon slots).
6. **DEFAULTED** `profiles.actif=TRUE` where source had no actif flag (9 profiles).
7. Core chantier labels, affectation links, period hours, and declaration numerics largely **MATCH** or **TRANSFORMED** — insufficient to claim full business preservation.

## Explicit non-reliance on prior reports

This verdict was derived from:
- raw `afgveikz.json`, `hzppst.json`, `merged.json`
- live local Postgres queries
- independent merge replay
- independent scoring formula documented in `10_BUSINESS_PRESERVATION_SCORE.md`

Prior markdown/JSON scores and conclusions were treated as untrusted and not reused as inputs.

## Bottom line

The migration preserved a **substantial subset of timesheet numeric facts** but **failed** to preserve authentication, full identity under merge collision, and several business information models (GPS history, comments, schedule semantics). Therefore business information preservation is **MATERIALLY_DEGRADED**.
