/*
  Realtime replica identity for collaborator notifications (worksite assignments).
  Unified API SSE layer reads Postgres logical changes; no supabase_realtime publication.
*/

ALTER TABLE public.affectations_chantiers REPLICA IDENTITY FULL;
