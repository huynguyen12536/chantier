-- OTP storage for custom password reset (SMTP via edge functions, not Supabase Auth email)
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_otps_email_created_idx
  ON public.password_reset_otps (lower(email), created_at DESC);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
