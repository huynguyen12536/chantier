-- Imp-11 Administration — UNION additive schema only (phone + nonempty matricule UNIQUE).
-- Do not DROP / rename / rewrite prior migrations.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- CVL uniqueness for nonempty matricule (null/empty allowed for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_matricule_nonempty_uidx
  ON profiles (matricule)
  WHERE matricule IS NOT NULL AND btrim(matricule) <> '';

COMMENT ON COLUMN profiles.phone IS 'CVL profiles.phone — Imp-11 UNION additive';
