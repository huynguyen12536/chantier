/*
  # Add phone column to profiles table

  1. Changes
    - Add nullable `phone` (text) column to `profiles` table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;
END $$;
