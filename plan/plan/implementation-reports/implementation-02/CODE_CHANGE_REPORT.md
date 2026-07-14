# CODE_CHANGE_REPORT — Imp-02 Authentication

## New
| File | Why | Mapping |
|---|---|---|
| `migrations/002_auth_profiles.sql` | profiles + refresh_tokens | CVL auth+profiles |
| `modules/auth/service.js` | login/refresh/logout/me | auth_mapping |
| `modules/auth/controller.js` | HTTP handlers | ADR Identity |
| `test/auth.test.js` | API tests | Wave2 gates |

## Modified
| File | Why |
|---|---|
| `modules/auth/routes.js` | wire real handlers |
| `shared/middleware/auth.js` | JWT verify + requireRoles |
| `config/env.js` | refresh expiry + shorter access default |

## Frontend
Unchanged.
