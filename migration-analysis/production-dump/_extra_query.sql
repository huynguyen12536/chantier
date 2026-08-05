\o /out/04_function_bodies.sql
SELECT pg_get_functiondef(p.oid) AS def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

\o /out/05_extra_inventory.txt
SELECT '=== ALL PUBLIC FUNCS ===' AS section;
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY 1;

SELECT '=== EXPECTED MISSING ON PROD ===' AS section;
SELECT x FROM (VALUES
  ('auto_approve_week_suggestion_replication'),
  ('calculer_heures_cadre_chantier'),
  ('minutes_from_time')
) v(x)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname=v.x
);

SELECT '=== REALTIME PUBS ===' AS section;
SELECT pubname FROM pg_publication ORDER BY 1;

SELECT '=== REALTIME PUB TABLES supabase_realtime ===' AS section;
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY 1,2;

SELECT '=== ALL PUBLICATION TABLES (non messages) ===' AS section;
SELECT pubname, schemaname, tablename FROM pg_publication_tables
WHERE tablename NOT LIKE 'messages_%' ORDER BY 1,2,3;

SELECT '=== MIGRATION HISTORY ===' AS section;
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;

SELECT '=== KEY COLUMNS ===' AS section;
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND column_name IN ('nb_deplacements','phone','matricule','panier_repas','deplacement')
ORDER BY table_name, column_name;

SELECT '=== VIEW DEF ===' AS section;
SELECT pg_get_viewdef('public.synthese_heures_journalieres'::regclass, true);
\o
