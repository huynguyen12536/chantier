-- Multi-tenant RBAC: companies, company_id on business tables, platform audit

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'disabled')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.chantiers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.zones_equipe ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.affectations_chantiers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.zones_ouvriers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.zones_chantiers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.declarations_heures ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.periodes_travail ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.absences ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

DO $$
BEGIN
  IF to_regclass('public.approval_audit_events') IS NOT NULL THEN
    ALTER TABLE public.approval_audit_events
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
  END IF;
END $$;

INSERT INTO public.companies (name, slug, status, settings)
VALUES (
  'Default Company',
  'default-company',
  'active',
  jsonb_build_object(
    'timezone', 'Europe/Paris',
    'workingHours', jsonb_build_object('morningStart', '08:00', 'morningEnd', '12:00', 'afternoonStart', '13:00', 'afternoonEnd', '17:00'),
    'overtimeRules', jsonb_build_object('dailyThresholdHours', 7),
    'holidayConfiguration', jsonb_build_array(),
    'approvalConfiguration', jsonb_build_object('autoApproveEnabled', false)
  )
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  default_id UUID;
BEGIN
  SELECT id INTO default_id FROM public.companies WHERE slug = 'default-company' LIMIT 1;
  IF default_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles SET company_id = default_id WHERE company_id IS NULL;
  UPDATE public.chantiers SET company_id = default_id WHERE company_id IS NULL;
  UPDATE public.zones_equipe SET company_id = default_id WHERE company_id IS NULL;

  UPDATE public.affectations_chantiers ac
    SET company_id = c.company_id
    FROM public.chantiers c
    WHERE ac.chantier_id = c.id AND ac.company_id IS NULL;

  UPDATE public.zones_chantiers zc
    SET company_id = c.company_id
    FROM public.chantiers c
    WHERE zc.chantier_id = c.id AND zc.company_id IS NULL;

  UPDATE public.zones_ouvriers zo
    SET company_id = z.company_id
    FROM public.zones_equipe z
    WHERE zo.zone_id = z.id AND zo.company_id IS NULL;

  ALTER TABLE public.periodes_travail DISABLE TRIGGER USER;
  UPDATE public.periodes_travail p
    SET company_id = c.company_id
    FROM public.chantiers c
    WHERE p.chantier_id = c.id AND p.company_id IS NULL;
  ALTER TABLE public.periodes_travail ENABLE TRIGGER USER;

  UPDATE public.declarations_heures d
    SET company_id = c.company_id
    FROM public.chantiers c
    WHERE d.chantier_id = c.id AND d.company_id IS NULL;

  UPDATE public.absences SET company_id = default_id WHERE company_id IS NULL;

  IF to_regclass('public.approval_audit_events') IS NOT NULL THEN
    UPDATE public.approval_audit_events ae
      SET company_id = d.company_id
      FROM public.declarations_heures d
      WHERE ae.declaration_id = d.id AND ae.company_id IS NULL;
    UPDATE public.approval_audit_events SET company_id = default_id WHERE company_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_id_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_role_check
  CHECK (role = 'system_admin' OR company_id IS NOT NULL);

ALTER TABLE public.chantiers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.zones_equipe ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.affectations_chantiers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.zones_ouvriers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.zones_chantiers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.declarations_heures ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.periodes_travail ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.absences ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.approval_audit_events') IS NOT NULL THEN
    ALTER TABLE public.approval_audit_events ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_company_id ON public.chantiers(company_id);
CREATE INDEX IF NOT EXISTS idx_zones_equipe_company_id ON public.zones_equipe(company_id);
CREATE INDEX IF NOT EXISTS idx_affectations_chantiers_company_id ON public.affectations_chantiers(company_id);
CREATE INDEX IF NOT EXISTS idx_declarations_heures_company_id ON public.declarations_heures(company_id);
CREATE INDEX IF NOT EXISTS idx_periodes_travail_company_id ON public.periodes_travail(company_id);
CREATE INDEX IF NOT EXISTS idx_absences_company_id ON public.absences(company_id);

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_company_id ON public.platform_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created_at ON public.platform_audit_logs(created_at DESC);
