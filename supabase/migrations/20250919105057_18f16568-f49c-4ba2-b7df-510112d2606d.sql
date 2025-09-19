-- Create a secure RPC function for creating employee profiles
CREATE OR REPLACE FUNCTION public.admin_create_employee_profile(
  p_user_id UUID,
  p_profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id UUID;
  result_record RECORD;
BEGIN
  -- Validate caller has HR or Admin role
  IF NOT (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only HR/Admin can create employee profiles');
  END IF;
  
  -- Validate required fields
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_id is required');
  END IF;
  
  IF p_profile_data IS NULL OR p_profile_data = '{}'::jsonb THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_data is required');
  END IF;
  
  -- Check if user already has an employee profile
  IF EXISTS (SELECT 1 FROM employee_profiles WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employee profile already exists for this user');
  END IF;
  
  -- Ensure declaration fields have defaults
  IF (p_profile_data ->> 'declaration_text') IS NULL OR (p_profile_data ->> 'declaration_text') = '' THEN
    p_profile_data = p_profile_data || jsonb_build_object(
      'declaration_text', 
      'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.'
    );
  END IF;
  
  IF (p_profile_data ->> 'declaration_signed_by') IS NULL OR (p_profile_data ->> 'declaration_signed_by') = '' THEN
    p_profile_data = p_profile_data || jsonb_build_object(
      'declaration_signed_by', 
      COALESCE(p_profile_data ->> 'name_full', 'System')
    );
  END IF;
  
  IF (p_profile_data ->> 'declaration_signed_at') IS NULL OR (p_profile_data ->> 'declaration_signed_at') = '' THEN
    p_profile_data = p_profile_data || jsonb_build_object(
      'declaration_signed_at', 
      CURRENT_DATE
    );
  END IF;
  
  -- Ensure JSON array fields are proper arrays
  IF (p_profile_data -> 'family_particulars') IS NOT NULL AND jsonb_typeof(p_profile_data -> 'family_particulars') != 'array' THEN
    p_profile_data = p_profile_data || jsonb_build_object('family_particulars', '[]'::jsonb);
  END IF;
  
  IF (p_profile_data -> 'education_qualification') IS NOT NULL AND jsonb_typeof(p_profile_data -> 'education_qualification') != 'array' THEN
    p_profile_data = p_profile_data || jsonb_build_object('education_qualification', '[]'::jsonb);
  END IF;
  
  IF (p_profile_data -> 'next_of_kin') IS NOT NULL AND jsonb_typeof(p_profile_data -> 'next_of_kin') != 'array' THEN
    p_profile_data = p_profile_data || jsonb_build_object('next_of_kin', '[]'::jsonb);
  END IF;
  
  -- Insert the employee profile
  INSERT INTO employee_profiles (
    user_id,
    name_full,
    email,
    mobile_phone,
    address,
    national_id,
    marital_status,
    date_of_birth,
    gender,
    nationality,
    religion,
    family_particulars,
    education_qualification,
    next_of_kin,
    declaration_text,
    declaration_signed_by,
    declaration_signed_at,
    employee_id,
    user_role,
    status,
    created_by
  ) VALUES (
    p_user_id,
    p_profile_data ->> 'name_full',
    p_profile_data ->> 'email',
    p_profile_data ->> 'mobile_phone',
    p_profile_data ->> 'address',
    p_profile_data ->> 'national_id',
    p_profile_data ->> 'marital_status',
    (p_profile_data ->> 'date_of_birth')::date,
    p_profile_data ->> 'gender',
    p_profile_data ->> 'nationality',
    p_profile_data ->> 'religion',
    COALESCE(p_profile_data -> 'family_particulars', '[]'::jsonb),
    COALESCE(p_profile_data -> 'education_qualification', '[]'::jsonb),
    COALESCE(p_profile_data -> 'next_of_kin', '[]'::jsonb),
    p_profile_data ->> 'declaration_text',
    p_profile_data ->> 'declaration_signed_by',
    (p_profile_data ->> 'declaration_signed_at')::date,
    p_profile_data ->> 'employee_id',
    p_profile_data ->> 'user_role',
    COALESCE(p_profile_data ->> 'status', 'active'),
    auth.uid()
  ) RETURNING id INTO result_id;
  
  -- Get the created record
  SELECT * FROM employee_profiles WHERE id = result_id INTO result_record;
  
  -- Log successful creation
  PERFORM log_security_event(
    auth.uid(),
    'employee_profile_created',
    jsonb_build_object(
      'employee_profile_id', result_id,
      'target_user_id', p_user_id,
      'created_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'id', result_id,
    'message', 'Employee profile created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  PERFORM log_security_event(
    auth.uid(),
    'employee_profile_creation_failed',
    jsonb_build_object(
      'error', SQLERRM,
      'target_user_id', p_user_id,
      'attempted_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$;

-- Create a BEFORE INSERT trigger to ensure data integrity
CREATE OR REPLACE FUNCTION public.update_employee_profile_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure declaration fields are never null
  IF NEW.declaration_text IS NULL OR NEW.declaration_text = '' THEN
    NEW.declaration_text = 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.';
  END IF;
  
  IF NEW.declaration_signed_by IS NULL OR NEW.declaration_signed_by = '' THEN
    NEW.declaration_signed_by = COALESCE(NEW.name_full, 'System');
  END IF;
  
  IF NEW.declaration_signed_at IS NULL THEN
    NEW.declaration_signed_at = CURRENT_DATE;
  END IF;
  
  -- Ensure JSON arrays are never null
  IF NEW.family_particulars IS NULL THEN
    NEW.family_particulars = '[]'::jsonb;
  END IF;
  
  IF NEW.education_qualification IS NULL THEN
    NEW.education_qualification = '[]'::jsonb;
  END IF;
  
  IF NEW.next_of_kin IS NULL THEN
    NEW.next_of_kin = '[]'::jsonb;
  END IF;
  
  -- Ensure status has a default
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_employee_profile_defaults_trigger ON employee_profiles;
CREATE TRIGGER update_employee_profile_defaults_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_profile_defaults();