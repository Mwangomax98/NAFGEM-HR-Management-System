-- Create weekly_tasks table for employee weekly task submissions
CREATE TABLE public.weekly_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'evaluated')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, week_start_date)
);

-- Create task_submissions table for individual tasks
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_task_id UUID NOT NULL REFERENCES public.weekly_tasks(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  completion_status TEXT NOT NULL DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_evaluations table for HR feedback
CREATE TABLE public.task_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_submission_id UUID NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 5),
  completion_assessment TEXT CHECK (completion_assessment IN ('completed', 'partially_completed', 'not_completed')),
  feedback TEXT,
  requires_explanation BOOLEAN DEFAULT FALSE,
  evaluation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_submission_id)
);

-- Create task_conversations table for chat system
CREATE TABLE public.task_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_evaluation_id UUID NOT NULL REFERENCES public.task_evaluations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weekly_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_tasks
CREATE POLICY "Employees can view their own weekly tasks" 
ON public.weekly_tasks 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Employees can create their own weekly tasks" 
ON public.weekly_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own weekly tasks" 
ON public.weekly_tasks 
FOR UPDATE 
USING (auth.uid() = employee_id);

CREATE POLICY "HR and Admin can view all weekly tasks" 
ON public.weekly_tasks 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can update weekly task status" 
ON public.weekly_tasks 
FOR UPDATE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for task_submissions
CREATE POLICY "Employees can view their own task submissions" 
ON public.task_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.weekly_tasks 
  WHERE id = task_submissions.weekly_task_id 
  AND employee_id = auth.uid()
));

CREATE POLICY "Employees can manage their own task submissions" 
ON public.task_submissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.weekly_tasks 
  WHERE id = task_submissions.weekly_task_id 
  AND employee_id = auth.uid()
));

CREATE POLICY "HR and Admin can view all task submissions" 
ON public.task_submissions 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for task_evaluations
CREATE POLICY "Employees can view evaluations of their tasks" 
ON public.task_evaluations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.task_submissions ts
  JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id
  WHERE ts.id = task_evaluations.task_submission_id 
  AND wt.employee_id = auth.uid()
));

CREATE POLICY "HR and Admin can manage all task evaluations" 
ON public.task_evaluations 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for task_conversations
CREATE POLICY "Users can view conversations for their tasks" 
ON public.task_conversations 
FOR SELECT 
USING (
  auth.uid() = sender_id OR 
  EXISTS (
    SELECT 1 FROM public.task_evaluations te
    JOIN public.task_submissions ts ON te.task_submission_id = ts.id
    JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id
    WHERE te.id = task_conversations.task_evaluation_id 
    AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their task conversations" 
ON public.task_conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.task_evaluations te
    JOIN public.task_submissions ts ON te.task_submission_id = ts.id
    JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id
    WHERE te.id = task_conversations.task_evaluation_id 
    AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_weekly_tasks_updated_at
BEFORE UPDATE ON public.weekly_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_submissions_updated_at
BEFORE UPDATE ON public.task_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_evaluations_updated_at
BEFORE UPDATE ON public.task_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();