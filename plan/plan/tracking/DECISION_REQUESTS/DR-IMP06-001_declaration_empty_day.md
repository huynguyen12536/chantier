# Decision Request — DR-IMP06-001

**Status:** ⏳ Waiting Human  
**Module:** Wave 2 Imp-06 Timesheet  
**Blocks:** DeclarationSyncService empty-day behavior  
**Related:** Conflict Matrix **C-04**; `sync_declarations_from_periods.md`

## Context

Khi không còn period active (`statut != rejetee`) cho khóa `(user, chantier, date)`:

| Source | Behavior |
|---|---|
| Verified Dump `hzppst` (Phase 2) | **DELETE** row `declarations_heures` |
| Repo migrations (intended) | Soft-cancel: `soumise` → `annulee` (+ validated_*); selective deletes |

FE cancel path (`validation.tsx`) cũng set `annulee` rồi DELETE periods — assumes announcement can exist as `annulee`.

## Options

| ID | Choice |
|---|---|
| **H** | Hard DELETE (dump parity) |
| **S** | Soft `annulee` (repo + FE cancel semantic) |
| **H+S** | Soft when cancel command; hard when last period deleted — require precise rules |

## Recommendation

**S (soft annulee)** for Unified Platform to stay compatible with FE cancel/`annulee` statut on declarations, while documenting dump H as historical env drift — **needs Product confirm**.

## Impact

Wrong choice → FE validation/cancel and calendar status mismatch; regression vs chosen Legacy surface.

## Requested

Reply **H / S / H+S** (with rules if H+S).
