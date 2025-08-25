-- Create timesheets table
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timesheet entries table for daily breakdowns
CREATE TABLE public.timesheet_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  project_name TEXT NOT NULL,
  hours_worked DECIMAL(4,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timesheet attachments table
CREATE TABLE public.timesheet_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_attachments ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for timesheet attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('timesheet-attachments', 'timesheet-attachments', false);

-- RLS Policies for timesheets
CREATE POLICY "Employees can view their own timesheets" 
ON public.timesheets 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Employees can create their own timesheets" 
ON public.timesheets 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own draft timesheets" 
ON public.timesheets 
FOR UPDATE 
USING (auth.uid() = employee_id AND status = 'draft');

CREATE POLICY "HR and Admin can view all timesheets" 
ON public.timesheets 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can update timesheet status" 
ON public.timesheets 
FOR UPDATE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for timesheet entries
CREATE POLICY "Employees can manage their own timesheet entries" 
ON public.timesheet_entries 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.timesheets 
  WHERE timesheets.id = timesheet_entries.timesheet_id 
  AND timesheets.employee_id = auth.uid()
));

CREATE POLICY "HR and Admin can view all timesheet entries" 
ON public.timesheet_entries 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for timesheet attachments
CREATE POLICY "Employees can manage their own timesheet attachments" 
ON public.timesheet_attachments 
FOR ALL 
USING (auth.uid() = uploaded_by OR EXISTS (
  SELECT 1 FROM public.timesheets 
  WHERE timesheets.id = timesheet_attachments.timesheet_id 
  AND timesheets.employee_id = auth.uid()
));

CREATE POLICY "HR and Admin can view all timesheet attachments" 
ON public.timesheet_attachments 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for timesheet attachments
CREATE POLICY "Users can upload their own timesheet attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'timesheet-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own timesheet attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'timesheet-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR and Admin can view all timesheet attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'timesheet-attachments' AND (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- Create triggers for updated_at
CREATE TRIGGER update_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timesheet_entries_updated_at
BEFORE UPDATE ON public.timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();