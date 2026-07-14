/*
  # Make matricule nullable in profiles

  - Allows creating users without specifying a matricule
  - The application will auto-generate one if not provided
*/

ALTER TABLE profiles ALTER COLUMN matricule DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN matricule SET DEFAULT '';
