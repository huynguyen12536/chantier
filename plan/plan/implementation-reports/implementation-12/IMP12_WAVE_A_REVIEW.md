# IMP12_WAVE_A_REVIEW.md

**Date:** 2026-07-15  
**Commit reviewed:** `a706e1111f`  
**Verdict:** **APPROVED / COMPLETE**

Human review: architecture PASS · scope PASS · ownership PASS · dual-path compat PASS · tests 80/80 PASS.

Wave B remains **blocked** until new authorization.

## Non-blocking recommendations (noted)

| # | Recommendation | Status |
|---|---|---|
| 1 | Keep mappers isolated from controllers | Already: controllers call mapper modules only for envelopes |
| 2 | Match FE HTTP status semantics | Wave A mirrors Edge 201 create / 200 delete / RPC 200 void; revisit if FE contract diffs emerge |
| 3 | Correlation IDs on compat routes | Already: global `correlationId` middleware runs before mounts; header `x-correlation-id` echoed |
| 4 | Document compat vs primary APIs | Done: `api-chantier/README.md` API index |
