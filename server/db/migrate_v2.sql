-- NAFGEM HR v2 migration (run after migrate_v2_enums.sql)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS donor_country TEXT;

DROP TABLE IF EXISTS public.exit_conversations CASCADE;
DROP TABLE IF EXISTS public.exit_attachments CASCADE;
DROP TABLE IF EXISTS public.exit_checklist_items CASCADE;
DROP TABLE IF EXISTS public.exit_assets CASCADE;
DROP TABLE IF EXISTS public.exit_requests CASCADE;

DROP TABLE IF EXISTS public.task_evaluations CASCADE;
DROP TABLE IF EXISTS public.task_submissions CASCADE;
DROP TABLE IF EXISTS public.weekly_tasks CASCADE;
DROP VIEW IF EXISTS public.weekly_target_progress;

DO $$ BEGIN
  CREATE TYPE public.nafgem_region AS ENUM ('Kilimanjaro', 'Manyara', 'Arusha', 'Tanga', 'Lindi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nafgem_program AS ENUM (
    'FGM Prevention', 'GBV Response', 'Girls Education', 'Community Advocacy', 'Survivor Support'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.external_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  provider TEXT,
  training_date DATE,
  location TEXT,
  cost NUMERIC,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  facilitator TEXT,
  training_date DATE,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_training_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.internal_trainings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (training_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_on_project TEXT,
  region public.nafgem_region,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.field_activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program public.nafgem_program NOT NULL,
  region public.nafgem_region NOT NULL,
  activity_date DATE NOT NULL,
  description TEXT NOT NULL,
  beneficiaries_reached INTEGER DEFAULT 0,
  challenges TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_certifications_expiry ON public.employee_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_field_reports_submitted ON public.field_activity_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_field_reports_date ON public.field_activity_reports(activity_date);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON public.project_assignments(project_id);
