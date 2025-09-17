-- Create employee_profile_drafts table for saving form sections
CREATE TABLE public.employee_profile_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sections JSONB NOT NULL DEFAULT '{}',
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One draft per user
);

-- Enable RLS
ALTER TABLE public.employee_profile_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for HR/Admin access
CREATE POLICY "HR and Admin can manage all drafts" 
ON public.employee_profile_drafts 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own draft" 
ON public.employee_profile_drafts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_employee_profile_drafts_updated_at
  BEFORE UPDATE ON public.employee_profile_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();