# FLOW_C_PARITY_REPORT — Imp-05

## Flow C (business-flows.md)
Promote chef → zones_equipe → zones_chantiers / zones_ouvriers; ouvrier visibility via membership.

## Lifecycle implemented (evidenced)

| Capability | Method | CVL |
|---|---|---|
| Create zone | POST `/api/zones` | INSERT policies |
| Update zone | PATCH `/api/zones/:id` | UPDATE own/admin |
| Delete zone | DELETE `/api/zones/:id` | DELETE own/admin |
| Link chantier | POST `…/chantiers` | INSERT |
| Unlink chantier | DELETE `…/chantiers/:chantierId` | DELETE (no UPDATE) |
| Add ouvrier | POST `…/ouvriers` | INSERT; restore soft via UPDATE |
| Soft end ouvrier | PATCH `…/ouvriers/:userId/soft-remove` | UPDATE date_fin |
| Hard unlink ouvrier | DELETE `…/ouvriers/:userId` | DELETE |

## Not invented
No “restore” separate endpoint beyond update-on-readd (CVL UPDATE).
