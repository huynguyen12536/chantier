# `rls_auto_enable`

**Nguồn:** Production dump `hzppsttpzzeuslnpcdkv` (Phase 2).  
**Không** có trong repo migrations app.

## Mục đích

Event-trigger style helper (Supabase platform pattern) cố gắng bật RLS trên object mới trong schema được enforce.

## Migrate relevance

**Low** cho Express + Postgres đích — RLS strategy sẽ do Phase 6/8 quyết định. Giữ trong inventory để không nhầm là business RPC.
