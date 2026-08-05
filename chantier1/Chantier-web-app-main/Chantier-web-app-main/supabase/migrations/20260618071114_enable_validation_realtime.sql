
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
  AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'declarations_heures')
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.declarations_heures;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
  AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'periodes_travail')
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.periodes_travail;
  END IF;
END $$;
