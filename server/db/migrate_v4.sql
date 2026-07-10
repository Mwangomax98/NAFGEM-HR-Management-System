-- v4: restore weekly tasks; drop timesheets

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

CREATE INDEX IF NOT EXISTS idx_weekly_tasks_employee ON public.weekly_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_weekly ON public.task_submissions(weekly_task_id);

DROP TABLE IF EXISTS public.timesheet_attachments CASCADE;
DROP TABLE IF EXISTS public.timesheet_entries CASCADE;
DROP TABLE IF EXISTS public.timesheets CASCADE;
