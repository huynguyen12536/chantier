ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

COMMENT ON COLUMN public.profiles.avatar_path IS
  'MinIO object path inside avatars bucket, e.g. {user_id}/avatar.jpg';
