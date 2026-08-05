/*
  Realtime for collaborator notifications (new worksite assignments).
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'affectations_chantiers'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affectations_chantiers;
  END IF;
END $$;

ALTER TABLE public.affectations_chantiers REPLICA IDENTITY FULL;
