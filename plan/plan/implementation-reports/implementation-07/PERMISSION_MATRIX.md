# PERMISSION_MATRIX — Imp-07

| Action | ouvrier | chef (in scope) | chef (out) | administratif | admin |
|---|---|---|---|---|---|
| Queue | ❌ | ✅ scoped | empty/403 writes | ✅ all | ✅ all |
| Approve/Reject/Cancel | ❌ | ✅ | ❌ 403 | ✅ | ✅ |
| Period decide | ❌ | ✅ | ❌ 403 | ✅ | ✅ |
