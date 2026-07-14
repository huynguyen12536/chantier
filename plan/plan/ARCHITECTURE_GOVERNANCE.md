# Architecture Governance — Database Evolution

**Status:** Binding for Wave 2  
**Policy:** [`DATABASE_EVOLUTION_POLICY.md`](../DATABASE_EVOLUTION_POLICY.md)  
**Manual:** [`AGENTIC_EXECUTION_MANUAL.md`](../AGENTIC_EXECUTION_MANUAL.md) §9  

## Overview

Consolidation + Replatforming produces one Unified PostgreSQL that is the **UNION** of legacy systems and approved Unified decisions. Agents must not treat any single dump or repository as the sole schema truth.

## Hard fails

- Silent `DROP*` / destructive `ALTER` without Rule 7 package  
- Reasoning of the form “missing in dump ⇒ remove”  
- Rewriting applied migration history instead of additive correctives  
- Undocumented schema/behavior/API decisions (missing Origin/Reason/Evidence/Decision/Impact/Rollback)

## Review scoring (database-related)

| Class | Treat as |
|---|---|
| P0 | Business integrity / FE contract / security |
| P1 | Architecture / module boundary / transaction |
| P2 | Legacy difference — investigate; not auto-FAIL |
| P3 | Improvement |

See also ADR-001 (service-owned business logic; PG for integrity support).
