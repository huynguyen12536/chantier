# PHASE15_RUNTIME_ARCHITECTURE.md

**Date:** 2026-07-15  
**Update of Phase 13 runtime for production hardening**

```
┌─────────────────────┐
│  Browser / Mobile   │
└──────────┬──────────┘
           │ EXPO_PUBLIC_API_URL
           ▼
┌─────────────────────┐     health: wget http://127.0.0.1/
│  chantier-web       │
│  (nginx static FE)  │
└─────────────────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│  chantier-api         │
│  /api/* Imp-02…12   │
│  /auth/v1 compat    │
│  /rest/v1 compat    │
│  /functions/v1      │
│  /events SSE        │
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐  ┌──────────────┐
│ demo DB │  │ test DB only │
│ :5432   │  │ :5433        │
│ chantier│  │ chantier_test│
└─────────┘  └──────────────┘
```

Legacy Deno Edge sources live under `archive/legacy-supabase-edge-functions/` (not deployed).
