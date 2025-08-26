-- Create weekly_targets table
CREATE TABLE public.weekly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  target_value NUMERIC NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_targets
CREATE POLICY "HR/Admin can manage all weekly targets"
  ON public.weekly_targets
  FOR ALL
  USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their assigned weekly targets"
  ON public.weekly_targets
  FOR SELECT
  USING (auth.uid() = assigned_to);

-- Add weekly_target_id to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN weekly_target_id UUID REFERENCES public.weekly_targets(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_targets_updated_at
  BEFORE UPDATE ON public.weekly_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for weekly target progress
CREATE VIEW public.weekly_target_progress AS
SELECT 
  wt.*,
  COALESCE(SUM(ts.completion_percentage), 0) as total_progress,
  COUNT(ts.id) as task_count,
  p.full_name as assigned_to_name,
  k.title as kpi_title,
  k.unit as kpi_unit
FROM public.weekly_targets wt
LEFT JOIN public.task_submissions ts ON wt.id = ts.weekly_target_id
LEFT JOIN public.profiles p ON wt.assigned_to = p.id
LEFT JOIN public.kpis k ON wt.kpi_id = k.id
GROUP BY wt.id, p.full_name, k.title, k.unit;