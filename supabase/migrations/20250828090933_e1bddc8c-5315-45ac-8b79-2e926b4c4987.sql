-- Create projects table for dynamic project data
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  donor TEXT,
  budget NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Everyone can view active projects" 
ON public.projects 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "HR and Admin can manage projects" 
ON public.projects 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert initial project data based on what's being used
INSERT INTO public.projects (id, name, donor, budget) VALUES
('proj-1', 'Clean Water Initiative', 'World Bank', 150000),
('proj-2', 'Education Support Program', 'USAID', 250000),
('proj-3', 'Healthcare Access Project', 'EU Commission', 180000)
ON CONFLICT (id) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();