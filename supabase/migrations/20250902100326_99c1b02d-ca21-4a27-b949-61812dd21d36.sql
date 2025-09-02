-- Create comprehensive employee profiles table
CREATE TABLE public.employee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Section A - Personal Particulars
  name_full TEXT NOT NULL,
  national_id TEXT NOT NULL UNIQUE,
  tin_no TEXT,
  contact_address TEXT NOT NULL,
  mobile_phones TEXT[] NOT NULL DEFAULT '{}',
  designation TEXT NOT NULL,
  place_of_work TEXT NOT NULL,
  date_of_appointment DATE NOT NULL,
  terms_of_service TEXT NOT NULL CHECK (terms_of_service IN ('Pensionable', 'Temporary', 'Secondment', 'Contract')),
  nationality TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT NOT NULL,
  religion TEXT,
  marital_status TEXT NOT NULL CHECK (marital_status IN ('Single', 'Married')),
  spouse_name TEXT,
  spouse_contacts TEXT,
  passport_photo_url TEXT,
  
  -- Section B - Family Particulars
  father_name TEXT NOT NULL,
  father_place_of_birth TEXT NOT NULL,
  father_nationality TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  mother_place_of_birth TEXT NOT NULL,
  mother_nationality TEXT NOT NULL,
  children JSONB DEFAULT '[]',
  
  -- Section C - Education Qualification
  education JSONB DEFAULT '[]',
  
  -- Section D - Next of Kin
  next_of_kin JSONB NOT NULL DEFAULT '[]',
  
  -- Section E - Declaration
  declaration_text TEXT NOT NULL,
  declaration_signed_by TEXT NOT NULL,
  declaration_signed_at DATE NOT NULL,
  
  -- System Fields
  employee_id TEXT NOT NULL UNIQUE,
  user_role TEXT NOT NULL DEFAULT 'employee' CHECK (user_role IN ('employee', 'hr', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  projects JSONB DEFAULT '[]'
);

-- Enable Row Level Security
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "HR and Admin can manage all employee profiles"
ON public.employee_profiles
FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own profile"
ON public.employee_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_employee_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_profile_timestamp
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_profile_timestamp();

-- Create indexes for better performance
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_employee_id ON public.employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_national_id ON public.employee_profiles(national_id);