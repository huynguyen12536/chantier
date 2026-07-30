-- Add system_admin enum value (must commit before use in follow-up migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'profile_role' AND e.enumlabel = 'system_admin'
  ) THEN
    ALTER TYPE profile_role ADD VALUE 'system_admin';
  END IF;
END $$;
