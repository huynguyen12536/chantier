# AGENTIC EXECUTION MANUAL

**Project mode:** Consolidation + Replatforming
**Execution mode:** Backend-first · **Frontend Frozen** · **Auto-Continue**
**Effective:** 2026-07-14
**Authority:** Operating rules for both waves. It overrides conflicting planning-mode or human-approval-between-module assumptions.

## 1. Two-wave boundary

| Wave | Scope | State | Boundary |
|---|---|---|---|
| **Wave 1** | Phases 0–14: reverse engineering, consolidation, design, planning, test/deployment strategy | **DONE** | Documentation/planning only; it does not assert working backend, live migration, cutover, rollout, or hypercare. Historical phase and final reports remain unchanged. |
| **Wave 2** | Implementation-01 onward: coding and verification of the Unified Platform | **START NOW** | Follow `WAVE2_IMPLEMENTATION_ROADMAP.md`; current module is **Imp-01 Infrastructure**. |

`plan/plan/final/WAVE2_TRANSITION.md` is the formal boundary statement. A Wave 1 “Done” status means its documentation quality gates passed, not that runtime behavior exists.

## 2. Mission and terminology

Build the Unified Platform: one frozen frontend contract, one backend, and one PostgreSQL target independent of Supabase.

| Term | Meaning |
|---|---|
| **Current Verified Legacy (CVL)** | Reverse-engineered workspace evidence in `migration-analysis/`. |
| **Pending Legacy Discovery (PLD)** | Future legacy input without sufficient evidence. |
| **Unified Platform** | Target backend and PostgreSQL compatible with the frozen frontend. |

The workspace is not automatically the final product. `migration-analysis/` is CVL evidence, not a mutable target-business source.

## 3. Non-negotiable constraints

### Frontend Frozen

The frontend under `chantier1/` is a **contract**. Do not edit its UI, logic, hooks, routing, authentication, API calls, payloads, or responses. Wave 2 backend work must preserve compatibility. A required contract change is a Decision Request; it never authorizes an unreviewed frontend edit.

### Source of truth / Evidence Priority (Rule 6)

Resolve conflicts in this **exact** order. A lower source may never invalidate a higher one:

1. Approved Decision Log  
2. Merge Specification (`migration-analysis/merge/`)  
3. Unified Domain Model / ADRs  
4. Business Rules (CVL shared rules)  
5. Frozen Frontend Contract  
6. Legacy A  
7. Legacy B  
8. Production Dumps  
9. Repository History  

**Absence is not evidence.** A dump or repository missing an object does **not** authorize removing it from the Unified Database.

Do not rewrite CVL factual records. PLD behavior is never invented. A conflict or missing evidence requires a Decision Request.

**Database evolution:** mandatory invariants in §9 and binding policy `DATABASE_EVOLUTION_POLICY.md`.

### Design-to-code translation

Do not clone Supabase. Port business behavior into application boundaries:

| Legacy behavior | Unified Platform implementation |
|---|---|
| Trigger / Edge function | domain event, controller, or write-path service |
| Function / RPC | application service and REST endpoint |
| Auth / RLS | JWT refresh lifecycle, RBAC, scoped policy |
| Realtime | contract-compatible event transport where required |
| Storage | **N/A for CVL; skip unless evidence or a new decision changes scope** |

Preferred code order: Flow → Use Case → Service → Permission → Transaction → Repository → Controller → DTO → API → DB.

## 4. Wave 2 module pipeline

Every implementation module must run, in order:

```text
Planner → Architect → Developer → Unit → Integration → Regression → Review
→ ArchVal → BizVal → Documentation → Git Commit → Git Push → Next Module
```

At each step record: **Input, Output, Evidence, Decision, Confidence, Issues, Next Step, PASS/FAIL** in that module’s `implementation-reports/implementation-NN/` folder.

- **Review:** inspect the diff against Decision Log, Merge Spec, Unified Domain, CVL business rules, and frozen FE contract. Classify findings **P0** Business/Security/FE · **P1** Architecture · **P2** Legacy Difference · **P3** Improvement. **P2 is not automatically FAIL** — FAIL only if it violates higher-priority Business Rules (Evidence Priority).  
- **ArchVal:** prove module boundaries and no loss of required business behavior; migrations must be **additive** unless Rule 7 removal package is complete.  
- **BizVal:** every implemented rule traces to CVL evidence or an explicit Decision Log row; otherwise **FAIL**.  
- **Documentation:** update the module report, status board, decisions, risks, and contract evidence as applicable. Implementations that add/remove schema, constraints, behavior, API, or domain rules must document **Origin · Reason · Evidence · Decision · Impact · Rollback**.

## 5. Auto-Continue and quality gates

Do not wait for human approval between modules. When all module quality gates pass:

1. Commit the completed module.
2. Push the commit.
3. Record SHA, branch, and message in the module report and status board.
4. Update Decision Log, Risk Register, and relevant documentation.
5. Start the next roadmap module automatically.

Module PASS requires:

- [ ] All pipeline steps PASS
- [ ] Module acceptance criteria and exit criteria PASS
- [ ] Unit, integration, and regression evidence recorded
- [ ] FE contract compatibility verified
- [ ] Documentation, decisions, and risks updated
- [ ] Commit, push, and SHA recorded

Any missing item is **FAIL / IN REVIEW** and prevents auto-continue.

## 6. Wave 2 stop conditions

Stop the current module only when one of these conditions is true:

- an unanswered Decision Request blocks the module;
- a technical blocker cannot be resolved with available evidence;
- CVL evidence conflicts with design and no decision resolves it;
- frozen frontend contract compatibility cannot be achieved;
- tests, review, ArchVal, or BizVal fail;
- a security, data-integrity, or production-readiness gate fails.

Otherwise continue through the pipeline and next module. Do not mark the backend or a module “Done” merely because planning documentation exists.

## 7. Git safety

Never stage secrets such as `.env` or credentials. Do not use `git add .` blindly. Commit message format:

```text
implementation-NN: <why> (pipeline PASS)
```

Before each commit, inspect the changed scope and verify it belongs to the active module.

## 8. Decision Requests and current pointer

When uncertain, do not guess. Use: **Context · Evidence · Options · Recommendation · Impact · Blocked work**.

| Item | Value |
|---|---|
| Current wave | Wave 2 — Coding |
| Current module | **STOP** — Governance update (Database Evolution Invariants). Imp-07 **not** authorized until human says continue |
| Governing decision | O3 + **UNION database / additive migrations** (2026-07-14) |
| Binding DB policy | `DATABASE_EVOLUTION_POLICY.md` |
| Roadmap | `WAVE2_IMPLEMENTATION_ROADMAP.md` |
| Manual changelog | `EXECUTION_MANUAL_CHANGELOG.md` |

## 9. DATABASE EVOLUTION INVARIANTS

> Binding detail: [`DATABASE_EVOLUTION_POLICY.md`](DATABASE_EVOLUTION_POLICY.md).  
> These rules are **permanent**. Violating them is an automatic ArchVal/Review **FAIL**.

### RULE 1 — UNION

Unified Database is the **UNION** of all legacy systems (+ Unified decisions).  
It is **not** Legacy A, Legacy B, Production Dump, or Repository alone.

### RULE 2 — Absence is NOT evidence

If one legacy has X and another does not, the missing object **does not authorize removal**.  
**Forbidden:** “dump does not contain X ⇒ remove X.”

### RULE 3 — Destructive SQL forbidden by default

Forbidden without Rule 7 approval: `DROP TABLE/COLUMN/CONSTRAINT/INDEX`, rename table/column, semantic `ALTER COLUMN`, PK/FK behavior changes, removing CHECK/UNIQUE/NOT NULL/indexes/business constraints/triggers still required/views still used by FE.

### RULE 4 — Additive preferred

Prefer: `CREATE TABLE`, `ADD COLUMN/INDEX/CHECK/FK/VIEW/FUNCTION`, compatibility adapters, backfill, data migration; `CREATE TRIGGER` only if still required.

### RULE 5 — Information Preservation

On disagreement default is **KEEP**. Merge first; remove later only if proven obsolete under Rule 7.

### RULE 6 — Evidence Priority

See §3. Decision Log → Merge Spec → Unified Domain → Business Rules → FE Contract → Legacy A → Legacy B → Dumps → Repo history.

### RULE 7 — Removal Standard

Destructive work requires **all**: Architecture Review · Business Validation · Merge Spec support · Decision Log · **Human approval**. Otherwise forbidden.

### RULE 8 — Migration Principle

Do not rewrite migration history to undo applied effects. Correct with **new additive migrations** (e.g. 006 adverse → 007 restore).

### RULE 9 — Review Rule

Classify P0–P3. Legacy Difference (P2) ≠ automatic defect.

### RULE 10 — No Silent Decisions

Report every schema/behavior/API/domain/migration add or remove with Origin · Reason · Evidence · Decision · Impact · Rollback.
