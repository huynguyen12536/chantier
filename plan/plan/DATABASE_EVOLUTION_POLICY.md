# DATABASE EVOLUTION POLICY

**Authority:** Permanent Agentic Flow invariant  
**Effective:** 2026-07-14  
**Canonical also in:** `AGENTIC_EXECUTION_MANUAL.md` § DATABASE EVOLUTION INVARIANTS  
**Trigger incident:** Imp-05 parity (`266efc4f8c`) assumed “dump missing ⇒ DROP UNIQUE” — forbidden forever.

---

## Project identity

The Unified Platform is **Consolidation + Replatforming**.

It is **NOT** Legacy Cloning.

The Unified PostgreSQL database is the **UNION** of both legacy Supabase systems **plus** approved Unified Platform decisions.

It must **never silently lose information**.

---

## RULE 1 — UNION, not a single source

Unified Database is the UNION of all legacy systems.

It is **NOT**:
- Legacy A alone  
- Legacy B alone  
- Production Dump alone  
- Repository alone  

---

## RULE 2 — Absence is NOT evidence

If Legacy A contains something and Legacy B does not, the missing object **does not authorize removal**.

**Forbidden assumption:**

> “Legacy dump does not contain X ⇒ X should be removed.”

Replace with: **absence is not evidence.**

---

## RULE 3 — Destructive SQL forbidden by default

Without explicit approval (Rule 7), these are forbidden:

- `DROP TABLE` / `DROP COLUMN` / `DROP CONSTRAINT` / `DROP INDEX`
- `RENAME TABLE` / `RENAME COLUMN`
- `ALTER COLUMN` that changes semantics
- Altering PRIMARY KEY / FOREIGN KEY behavior
- Removing CHECK / UNIQUE / NOT NULL / indexes / business constraints
- Removing triggers still required by business
- Removing views still used by FE

---

## RULE 4 — Additive evolution preferred

Allowed by default:

- `CREATE TABLE`
- `ADD COLUMN` / `ADD INDEX` / `ADD CHECK` / `ADD FK` / `ADD VIEW`
- `ADD FUNCTION` / `CREATE TRIGGER` (if still required)
- Compatibility adapter / backfill / data migration

---

## RULE 5 — Information Preservation

When two legacy systems disagree, the **default is KEEP**.

Never destroy information. Merge first. Remove later only if proven obsolete under Rule 7.

---

## RULE 6 — Evidence Priority (exact order)

1. Approved Decision Log  
2. Merge Specification  
3. Unified Domain Model  
4. Business Rules (CVL)  
5. Frozen Frontend Contract  
6. Legacy A  
7. Legacy B  
8. Production Dumps  
9. Repository History  

A lower-priority source may **never** invalidate a higher-priority source.

---

## RULE 7 — Removal Standard

Any destructive operation requires **ALL** of:

- Architecture Review  
- Business Validation  
- Merge Specification support  
- Decision Log entry  
- Human approval  

Without all five → **Removal is forbidden.**

---

## RULE 8 — Migration history is immutable

Never rewrite applied migration files’ *history of application*.

Corrections are **new additive migrations** (e.g. 006 bad effect → 007 restore). Prefer also correcting forward-looking contents only when documenting non-destructive intent; never rely on rewriting to undo production state.

---

## RULE 9 — Review classification

Review Agents must classify findings:

| Class | Meaning |
|---|---|
| **P0** | Business / Security / FE Contract |
| **P1** | Architecture |
| **P2** | Legacy Difference |
| **P3** | Improvement |

**P2 Legacy Difference is NOT automatically a defect.**  
FAIL only after explaining why the difference violates Business Rules / higher evidence (Rule 6).

---

## RULE 10 — No Silent Decisions

Every new or removed: schema, constraint, behavior, API, domain rule, migration must document in the implementation report:

**Origin · Reason · Evidence · Decision · Impact · Rollback**

No undocumented architectural decisions.

---

## Related documents

- `AGENTIC_EXECUTION_MANUAL.md`  
- `DATABASE_GOVERNANCE_UPDATE.md`  
- `EXECUTION_MANUAL_CHANGELOG.md`  
- Decision Log row 2026-07-14 (UNION / additive migrations)  
- `IMP05_PARITY_REWORK_REPORT.md` (incident)
