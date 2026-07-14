# PERMISSION_MATRIX — Imp-06

| Action | ouvrier | chef_equipe | administratif | admin |
|---|---|---|---|---|
| Create/update/delete own periods | ✅ | ✅ | ✅ | ✅ |
| List periods/declarations (scoped) | ✅ | ✅ | ✅ | ✅ |
| Decide declaration (validate/reject) | ❌ 403 | ✅ | ✅ | ✅ |
| Auto-approve (system actor write) | N/A (service) | N/A | N/A | N/A |

## Notes
- All routes require JWT (`requireAuth`).  
- Decide uses `requireRoles('admin','administratif','chef_equipe')`.  
- Deeper chef↔zone/worksite ownership checks remain Imp-07 hardening if CVL requires zone-scoped approval beyond role gate.
