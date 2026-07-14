# Frozen Frontend Contract Matrix

The frontend is frozen. This is an observable contract that the future backend must adapt to; it is not authorization to edit the frontend.

| Area | Contract expectation | CVL evidence | Unified Platform adapter requirement |
|---|---|---|---|
| Auth | password sign-in, session bootstrap/state change, local sign-out | FE inventory §10–42 | provide equivalent session/identity behavior |
| Profile | read/update `profiles` | FE inventory §14–18 | preserve route/data contract |
| Tables | direct reads/writes to 8 public tables | `tables-used-by-frontend.md` §1 | preserve names/payloads at boundary where required |
| RPC | active `delete_chantier_cascade`; week approval RPC commented | FE inventory §180–190 | support active RPC compatibility or adapter |
| Edge | raw fetch `create-user`, `delete-user` with bearer session | FE inventory §124–151, §170–176 | preserve endpoints/authorization semantics or gateway adapter |
| Realtime | postgres changes for periods/declarations | FE inventory §194–206 | publish equivalent updates |
| Storage | no `.storage` usage | FE inventory §186, §196 | no migration requirement |

Contract tables: `profiles`, `chantiers`, `affectations_chantiers`, `periodes_travail`, `declarations_heures`, `zones_equipe`, `zones_chantiers`, `zones_ouvriers`.
