-- Create KPI tables for Monitoring & Evaluation module

-- Core KPI definitions table
CREATE TABLE public.kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  title text NOT NULL,
  description text,
  unit text NOT NULL, -- %, number, currency, etc.
  target_value numeric NOT NULL,
  timeframe text NOT NULL DEFAULT 'quarterly', -- quarterly, annually, monthly
  responsible_user_id uuid REFERENCES auth.users(id),
  category text DEFAULT 'general', -- operational, financial, outcome, etc.
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- KPI actual values over time
CREATE TABLE public.kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid REFERENCES public.kpis(id) ON DELETE CASCADE,
  actual_value numeric NOT NULL,
  reporting_period date NOT NULL, -- month/quarter end date
  entered_by uuid REFERENCES auth.users(id),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Add optional KPI linkage to task submissions
ALTER TABLE public.task_submissions ADD COLUMN linked_kpi_id uuid REFERENCES public.kpis(id);

-- Enable RLS on new tables
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for KPIs
-- Employees see project KPIs based on their profile project
CREATE POLICY "Employees see project KPIs" ON public.kpis
FOR SELECT USING (
  project_id = (SELECT project FROM public.profiles WHERE id = auth.uid())
);

-- HR/Admin full access to KPIs
CREATE POLICY "HR/Admin full KPI access" ON public.kpis
FOR ALL USING (
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for KPI Values
-- Employees can view KPI values for their project KPIs
CREATE POLICY "Employees see project KPI values" ON public.kpi_values
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.kpis k 
    WHERE k.id = kpi_values.kpi_id 
    AND k.project_id = (SELECT project FROM public.profiles WHERE id = auth.uid())
  )
);

-- HR/Admin can manage all KPI values
CREATE POLICY "HR/Admin manage KPI values" ON public.kpi_values
FOR ALL USING (
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create view for gaps computation
CREATE VIEW public.kpi_gaps AS
SELECT 
  k.id as kpi_id,
  k.title,
  k.project_id,
  k.target_value,
  k.unit,
  k.category,
  k.timeframe,
  k.description,
  COALESCE(latest_value.actual_value, 0) as actual_value,
  (k.target_value - COALESCE(latest_value.actual_value, 0)) as gap_value,
  CASE 
    WHEN COALESCE(latest_value.actual_value, 0) >= k.target_value THEN 'on_track'
    WHEN COALESCE(latest_value.actual_value, 0) >= k.target_value * 0.8 THEN 'slightly_off'
    ELSE 'gap'
  END as status,
  latest_value.reporting_period,
  latest_value.comment as latest_comment
FROM public.kpis k
LEFT JOIN LATERAL (
  SELECT actual_value, reporting_period, comment
  FROM public.kpi_values kv 
  WHERE kv.kpi_id = k.id 
  ORDER BY reporting_period DESC 
  LIMIT 1
) latest_value ON true
WHERE k.is_active = true;

-- Triggers for updated_at
CREATE TRIGGER update_kpis_updated_at
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_kpis_project_id ON public.kpis(project_id);
CREATE INDEX idx_kpi_values_kpi_id ON public.kpi_values(kpi_id);
CREATE INDEX idx_kpi_values_reporting_period ON public.kpi_values(reporting_period DESC);