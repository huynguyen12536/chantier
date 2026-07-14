# Agent Routing Matrix — Chantier

Dùng khi **viết** task file (Primary Agent + Required Reviews).  
**Goal:** Consolidation + Replatforming.

| Work Domain | Primary Agent | Required Reviews |
|---|---|---|
| Merge Specification / A↔B mapping | Software Architect | Product Manager, Database Optimizer, Security Engineer |
| Unified Domain Discovery | Software Architect | Product Manager |
| Unified Database Modeling | Database Optimizer | Backend Architect, Security Engineer |
| Business Logic Consolidation | Backend Architect | Database Optimizer, Security Engineer |
| Frontend UI / wired tới API mới | Frontend Developer | Code Reviewer |
| Backend Express modules / services | Backend Architect | Senior Developer, Code Reviewer |
| Refactor structure (no behavior) | Backend Architect hoặc Frontend Developer | Code Reviewer, Senior Developer |
| Schema Postgres / indexes / migrations | Database Optimizer | Backend Architect, Code Reviewer |
| Port Triggers / Functions / RPC → services | Backend Architect | Database Optimizer, Senior Developer, Security Engineer |
| Auth (JWT, password, create/delete user) | Security Engineer | Backend Architect |
| Authorization / RLS → policies | Security Engineer | Backend Architect |
| Docker Compose / deploy | DevOps Automator | Security Engineer |
| Data migration / ETL / reconcile / identity merge | Database Optimizer | Security Engineer, Backend Architect |
| E2E unified flows validation | API Tester | FE + BE as needed |
| Reverse-eng docs / Legacy Analysis updates | Technical Writer | Software Architect |
| Domain / ADR / phase planning | Software Architect | Product Manager |
| Docs only (plan/, checklist) | Technical Writer | Product Manager |

## Mandatory Security Engineer review

- Auth / JWT / password hashing  
- Auth conflicts across A/B  
- DB access patterns / SERVICE role equivalents  
- RLS replacement / permission matrix / tenant isolation  
- Edge Function parity (create-user / delete-user)  
- Secrets in Docker / `.env`  
- Data migration scripts touching PII / duplicate identities  

## Mandatory API Tester

Task closes a user-visible end-to-end flow on the **unified** surface (once contracts exist).

## Mandatory Database Optimizer

- Target DDL / migration runner  
- Dump-vs-Legacy diff (Phase 2 historical)  
- Schema / FK / data merge conflicts  
- Trigger disable / cutover plans  

## Rule

Không Implementation khi task là Analysis/Design. Không clone Supabase làm Done.

One task → one Primary Agent. Reviews = separate passes, not co-implementers.

## Task Type (bắt buộc trên mỗi task)

`Analysis` · `Design` · `Implementation` · `Validation` · `Documentation`
