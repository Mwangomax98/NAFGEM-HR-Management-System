-- Create exit_requests table
CREATE TABLE public.exit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  resignation_reason TEXT NOT NULL,
  resignation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proposed_last_working_day DATE NOT NULL,
  final_last_working_day DATE,
  detailed_reason TEXT,
  handover_notes TEXT,
  replacement_suggestions TEXT,
  outstanding_tasks TEXT,
  contact_info_post_departure TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'hr_review', 'asset_verification', 'final_approval', 'completed', 'cancelled')),
  hr_reviewed_at TIMESTAMP WITH TIME ZONE,
  hr_reviewed_by UUID,
  hr_comments TEXT,
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_approved_by UUID,
  admin_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exit_assets table
CREATE TABLE public.exit_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exit_request_id UUID NOT NULL REFERENCES public.exit_requests(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  asset_description TEXT NOT NULL,
  asset_id TEXT,
  condition_notes TEXT,
  returned BOOLEAN NOT NULL DEFAULT FALSE,
  returned_date DATE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exit_checklist_items table
CREATE TABLE public.exit_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exit_request_id UUID NOT NULL REFERENCES public.exit_requests(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exit_conversations table
CREATE TABLE public.exit_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exit_request_id UUID NOT NULL REFERENCES public.exit_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'comment' CHECK (message_type IN ('comment', 'status_update', 'request_clarification')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exit_requests
CREATE POLICY "Employees can view their own exit requests"
ON public.exit_requests FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Employees can create their own exit requests"
ON public.exit_requests FOR INSERT
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their pending exit requests"
ON public.exit_requests FOR UPDATE
USING (auth.uid() = employee_id AND status = 'pending');

CREATE POLICY "HR and Admin can view all exit requests"
ON public.exit_requests FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can update exit requests"
ON public.exit_requests FOR UPDATE
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for exit_assets
CREATE POLICY "Users can view assets for their exit requests"
ON public.exit_assets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.exit_requests 
  WHERE id = exit_assets.exit_request_id 
  AND (employee_id = auth.uid() OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Employees can manage assets for their exit requests"
ON public.exit_assets FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.exit_requests 
  WHERE id = exit_assets.exit_request_id AND employee_id = auth.uid()
));

CREATE POLICY "HR and Admin can manage all exit assets"
ON public.exit_assets FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for exit_checklist_items
CREATE POLICY "Users can view checklist for their exit requests"
ON public.exit_checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.exit_requests 
  WHERE id = exit_checklist_items.exit_request_id 
  AND (employee_id = auth.uid() OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "HR and Admin can manage checklist items"
ON public.exit_checklist_items FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for exit_conversations
CREATE POLICY "Users can view conversations for their exit requests"
ON public.exit_conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.exit_requests 
  WHERE id = exit_conversations.exit_request_id 
  AND (employee_id = auth.uid() OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can send messages for their exit requests"
ON public.exit_conversations FOR INSERT
WITH CHECK (auth.uid() = sender_id AND EXISTS (
  SELECT 1 FROM public.exit_requests 
  WHERE id = exit_conversations.exit_request_id 
  AND (employee_id = auth.uid() OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
));

-- Create triggers for updated_at
CREATE TRIGGER update_exit_requests_updated_at
  BEFORE UPDATE ON public.exit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create default checklist items function
CREATE OR REPLACE FUNCTION public.create_default_exit_checklist(exit_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.exit_checklist_items (exit_request_id, task_title, task_description, order_index) VALUES
    (exit_request_id, 'Submit resignation letter', 'Formal resignation with notice period', 1),
    (exit_request_id, 'Complete handover documentation', 'Document ongoing projects and responsibilities', 2),
    (exit_request_id, 'Return company equipment', 'Laptop, ID badge, and other company property', 3),
    (exit_request_id, 'Final timesheet submission', 'Submit timesheet for your last period', 4),
    (exit_request_id, 'Exit interview scheduling', 'Schedule exit interview with HR', 5),
    (exit_request_id, 'Benefits and final pay discussion', 'Review final compensation and benefits', 6);
END;
$$;