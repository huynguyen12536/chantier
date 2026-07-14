# Data Merge Mapping

## Current decision

No business-data merge is designed in Phase 3. The available `hzppst` artifact is schema-only and `afgveikz` has no dump. They are evidence labels for CVL environment/repository drift, not datasets to combine.

| Data source | Classification | Allowed Phase 3 use | Not allowed |
|---|---|---|---|
| Repository migrations | CVL documentation evidence | object/rule provenance | assume deployed production data |
| `hzppst` schema dump | verified dump evidence | drift labeling and live-object comparison | production SoT promotion or row migration |
| `afgveikz` committed runtime ref | runtime candidate | identify confirmation requirement | schema/data inference |
| Pending Legacy Discovery | unavailable | record extension requirement | fabricate mappings/deduplication |

## Future merge prerequisites

1. Confirm source identity and production authority.
2. Obtain approved schema and data inventories for each source.
3. Define entity identity/matching, conflict winners, retention, audit, and rollback.
4. Reconcile each source rule through a Merge Decision.

No duplicate, row-level, or tenant merge rule is proposed because that would invent business behavior.
