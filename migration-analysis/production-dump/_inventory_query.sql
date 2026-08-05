\o /out/03_inventory.txt
SELECT '=== EXTENSIONS ===';
SELECT extname, extversion FROM pg_extension ORDER BY 1;

SELECT '=== SCHEMAS ===';
SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema' ORDER BY 1;

SELECT '=== TABLES public ===';
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;

SELECT '=== VIEWS public ===';
SELECT viewname FROM pg_views WHERE schemaname='public' ORDER BY 1;

SELECT '=== SEQUENCES public ===';
SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY 1;

SELECT '=== INDEXES public ===';
SELECT indexname, tablename FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;

SELECT '=== CONSTRAINTS ===';
SELECT conrelid::regclass AS table_name, conname, contype,
  pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2;

SELECT '=== TRIGGERS ===';
SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2,3;

SELECT '=== FUNCTIONS public ===';
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
  CASE p.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' WHEN 'a' THEN 'aggregate' WHEN 'w' THEN 'window' END AS kind
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
ORDER BY 1;

SELECT '=== RLS ENABLED ===';
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
ORDER BY 1;

SELECT '=== POLICIES ===';
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policyname;

SELECT '=== AUTH TRIGGERS ON auth.users ===';
SELECT trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema='auth' AND event_object_table='users'
ORDER BY 1;

SELECT '=== PUBLICATION TABLES ===';
SELECT pubname, schemaname, tablename FROM pg_publication_tables ORDER BY 1,2,3;
\o
