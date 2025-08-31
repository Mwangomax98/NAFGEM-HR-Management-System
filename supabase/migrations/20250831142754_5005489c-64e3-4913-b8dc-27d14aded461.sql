-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_number TEXT NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  contact_address TEXT,
  mobile_phone TEXT,
  designation TEXT,
  place_of_work TEXT,
  projects TEXT[] NOT NULL,
  date_of_appointment DATE,
  leave_type TEXT NOT NULL,
  number_of_days INTEGER NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  handover_details TEXT,
  replacement_person TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  impact TEXT DEFAULT 'low',
  hr_comments JSONB DEFAULT '[]'::jsonb,
  admin_comments JSONB DEFAULT '[]'::jsonb,
  days_granted INTEGER,
  hr_approved_date TIMESTAMP WITH TIME ZONE,
  final_decision_date TIMESTAMP WITH TIME ZONE,
  digital_signature JSONB,
  final_signature JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave balances table
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  total_entitlement INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_type, year)
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests
FOR SELECT
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own pending leave requests"
ON public.leave_requests
FOR UPDATE
USING (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "HR and Admin can view all leave requests"
ON public.leave_requests
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can update leave requests"
ON public.leave_requests
FOR UPDATE
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for leave_balances
CREATE POLICY "Users can view their own leave balances"
ON public.leave_balances
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "HR and Admin can view all leave balances"
ON public.leave_balances
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can manage leave balances"
ON public.leave_balances
FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default leave balance types for existing users
INSERT INTO public.leave_balances (user_id, leave_type, total_entitlement, used_days, year)
SELECT 
  id as user_id,
  leave_type,
  entitlement as total_entitlement,
  0 as used_days,
  EXTRACT(year FROM now()) as year
FROM auth.users
CROSS JOIN (
  VALUES 
    ('annual', 25),
    ('maternity', 90),
    ('paternity', 10),
    ('sick', 15),
    ('adoption', 30),
    ('compassionate', 5),
    ('personal', 5)
) AS leave_types(leave_type, entitlement)
ON CONFLICT (user_id, leave_type, year) DO NOTHING;