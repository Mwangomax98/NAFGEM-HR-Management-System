-- Harmony HR consolidated schema (no auth.users / no RLS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin', 'hr', 'employee',
    'super_admin', 'hr_admin', 'manager', 'field_officer'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  project TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'employee',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  donor TEXT,
  donor_country TEXT,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  employee_id TEXT NOT NULL UNIQUE,
  name_full TEXT NOT NULL,
  designation TEXT NOT NULL,
  place_of_work TEXT NOT NULL,
  date_of_appointment DATE NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT NOT NULL,
  nationality TEXT NOT NULL,
  national_id TEXT NOT NULL,
  tin_no TEXT,
  religion TEXT,
  marital_status TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  mobile_phones TEXT[] NOT NULL DEFAULT '{}',
  father_name TEXT NOT NULL,
  father_nationality TEXT NOT NULL,
  father_place_of_birth TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  mother_nationality TEXT NOT NULL,
  mother_place_of_birth TEXT NOT NULL,
  spouse_name TEXT,
  spouse_contacts TEXT,
  next_of_kin JSONB NOT NULL DEFAULT '{}',
  children JSONB,
  education JSONB,
  projects JSONB,
  passport_photo_url TEXT,
  terms_of_service TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'employee',
  status TEXT NOT NULL DEFAULT 'active',
  declaration_text TEXT NOT NULL DEFAULT '',
  declaration_signed_by TEXT NOT NULL DEFAULT '',
  declaration_signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_profile_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  sections JSONB NOT NULL DEFAULT '{}',
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INTEGER,
  total_entitlement NUMERIC NOT NULL DEFAULT 0,
  used_days NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, leave_type, year)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  ref_number TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  number_of_days NUMERIC NOT NULL,
  days_granted NUMERIC,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  projects TEXT[] NOT NULL DEFAULT '{}',
  designation TEXT,
  place_of_work TEXT,
  date_of_appointment DATE,
  contact_address TEXT,
  mobile_phone TEXT,
  replacement_person TEXT,
  handover_details TEXT,
  impact TEXT,
  hr_comments JSONB,
  admin_comments JSONB,
  digital_signature JSONB,
  final_signature JSONB,
  hr_approved_date TIMESTAMPTZ,
  final_decision_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  license_type TEXT,
  license_expiry DATE,
  home_base TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  capacity INTEGER,
  fuel_type TEXT,
  mileage INTEGER,
  insurance_expiry DATE,
  last_maintenance DATE,
  status TEXT NOT NULL DEFAULT 'available',
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  availability_type TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  drop_location TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  passengers_count INTEGER NOT NULL DEFAULT 1,
  objectives TEXT,
  expected_outcomes TEXT,
  terms_of_reference TEXT,
  luggage_notes TEXT,
  proposed_driver_id UUID REFERENCES public.drivers(id),
  proposed_vehicle_id UUID REFERENCES public.vehicles(id),
  assigned_driver_id UUID REFERENCES public.drivers(id),
  assigned_vehicle_id UUID REFERENCES public.vehicles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  project_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  passengers_count INTEGER NOT NULL DEFAULT 1,
  estimated_duration_hours NUMERIC NOT NULL DEFAULT 1,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'monthly',
  responsible_user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE,
  reporting_period TEXT NOT NULL,
  actual_value NUMERIC NOT NULL,
  comment TEXT,
  entered_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE SET NULL,
  target_value NUMERIC NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_task_id UUID NOT NULL REFERENCES public.weekly_tasks(id) ON DELETE CASCADE,
  weekly_target_id UUID REFERENCES public.weekly_targets(id) ON DELETE SET NULL,
  linked_kpi_id UUID REFERENCES public.kpis(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  completion_status TEXT NOT NULL DEFAULT 'pending',
  completion_percentage NUMERIC DEFAULT 0,
  completion_explanation TEXT,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  planned_completion_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_submission_id UUID NOT NULL UNIQUE REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_score NUMERIC,
  completion_assessment TEXT,
  feedback TEXT,
  requires_explanation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  conversation_type TEXT NOT NULL DEFAULT 'general',
  conversation_id UUID,
  conversation_title TEXT,
  related_record_id UUID,
  related_record_type TEXT,
  task_evaluation_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  trip_id UUID REFERENCES public.trip_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  old_role public.app_role,
  new_role public.app_role,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful views
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
  conversation_id,
  conversation_title,
  conversation_type,
  MAX(created_at) AS last_message_at,
  COUNT(*) AS message_count
FROM public.task_conversations
WHERE conversation_id IS NOT NULL
GROUP BY conversation_id, conversation_title, conversation_type;

CREATE OR REPLACE VIEW public.kpi_gaps AS
SELECT
  k.id AS kpi_id,
  k.title,
  k.target_value,
  COALESCE(SUM(kv.actual_value), 0) AS actual_total,
  k.target_value - COALESCE(SUM(kv.actual_value), 0) AS gap
FROM public.kpis k
LEFT JOIN public.kpi_values kv ON kv.kpi_id = k.id
GROUP BY k.id, k.title, k.target_value;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_requester ON public.leave_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_requester ON public.trip_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_employee ON public.weekly_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_weekly ON public.task_submissions(weekly_task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_conversations_conversation ON public.task_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON public.employee_profiles(user_id);

-- v2 tables (also in migrate_v2.sql)
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

CREATE TABLE IF NOT EXISTS public.staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ref_number TEXT NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  requester_name TEXT,
  hr_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  hr_approved_date TIMESTAMPTZ,
  final_decision_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
CREATE INDEX IF NOT EXISTS idx_staff_requests_requester ON public.staff_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON public.staff_requests(status);
CREATE INDEX IF NOT EXISTS idx_field_reports_submitted ON public.field_activity_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_field_reports_date ON public.field_activity_reports(activity_date);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON public.project_assignments(project_id);
