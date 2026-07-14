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

### Source of truth order

Read and resolve conflicts in this order:

1. Merge Specification (`migration-analysis/merge/`)
2. Unified Domain / ADRs
3. `migration-analysis/` CVL evidence
4. Decision Log
5. Risk Register
6. Master Plan and Wave 2 roadmap

Do not rewrite CVL factual records. PLD behavior is never invented. A conflict or missing evidence requires a Decision Request.

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

- **Review:** inspect the diff against Merge Spec, Unified Domain, CVL evidence, Decision Log, and frozen FE contract.
- **ArchVal:** prove module boundaries and no loss of required business behavior.
- **BizVal:** every implemented rule traces to CVL evidence or an explicit Decision Log row; otherwise **FAIL**.
- **Documentation:** update the module report, status board, decisions, risks, and contract evidence as applicable.

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
| Current module | Imp-01 Infrastructure (Platform) |
| Governing decision | O3 — continue with CVL; PLD stays evidence-gated |
| Roadmap | `WAVE2_IMPLEMENTATION_ROADMAP.md` |
