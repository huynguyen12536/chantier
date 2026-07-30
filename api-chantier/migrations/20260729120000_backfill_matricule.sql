-- Backfill profiles missing matricule (NULL or empty) with legacy USR + 6-digit codes.
DO $$
DECLARE
  r RECORD;
  candidate TEXT;
  attempts INT;
BEGIN
  FOR r IN
    SELECT id
    FROM profiles
    WHERE matricule IS NULL OR btrim(matricule) = ''
    ORDER BY created_at
  LOOP
    attempts := 0;
    LOOP
      candidate := 'USR' || lpad((floor(random() * 1000000))::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles p WHERE p.matricule = candidate);
      attempts := attempts + 1;
      IF attempts > 24 THEN
        candidate := 'USR' || lpad(
          (extract(epoch FROM clock_timestamp()) * 1000)::bigint % 1000000,
          6,
          '0'
        );
        EXIT;
      END IF;
    END LOOP;
    UPDATE profiles
    SET matricule = candidate, updated_at = NOW()
    WHERE id = r.id;
  END LOOP;
END $$;
