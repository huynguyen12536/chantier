# IMP08_STATS_TOTAL_HEURES_PARITY_FIX.md

**Status:** PASS  
**Scope:** Imp-08 only — `stats.total_heures` semantics

## Fix

`listExportStats` previously summed `splitHours(...).total_heures` (normales + overtime under cadre), which can omit wall-clock time before cadre start.

**Required FE contract:** `computeChantierHoursBreakdown(...).totalHeures` = `heure_fin - heure_debut`.

**Change:** aggregate with `durationHours(heure_debut, heure_fin)` only.

Unchanged: `splitHours`, payroll filters, permissions, DTOs, declarations, schema.

## Files

- `api-chantier/src/modules/export/service.js`
- `api-chantier/test/export.stats.parity.test.js` (new)
- this report

## Tests

`npm test` — **53/53 PASS** (wall-clock regression included).

## SHA

`b6c7e442a3eff505c4572cfba748b3872a32dad5`
