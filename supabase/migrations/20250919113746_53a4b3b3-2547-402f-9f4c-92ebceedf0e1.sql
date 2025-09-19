-- Fix and simplify employee profile creation to be saveable
-- 1) Replace admin_create_employee_profile to match current employee_profiles columns
-- 2) Add BEFORE INSERT defaults trigger to ensure required fields are populated
-- 3) Ensure updated_at trigger exists

-- Function: admin_create_employee_profile
CREATE OR REPLACE FUNCTION public.admin_create_employee_profile(p_user_id uuid, p_profile_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
BEGIN
  -- Authorization: only HR/Admin
  IF NOT (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only HR/Admin can create employee profiles');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_id is required');
  END IF;

  -- Prevent duplicates
  IF EXISTS (SELECT 1 FROM employee_profiles WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employee profile already exists for this user');
  END IF;

  -- Insert with safe defaults for all NOT NULL columns
  INSERT INTO public.employee_profiles (
    user_id,
    created_by,
    name_full,
    national_id,
    employee_id,
    contact_address,
    mobile_phones,
    designation,
    place_of_work,
    terms_of_service,
    nationality,
    place_of_birth,
    date_of_birth,
    date_of_appointment,
    marital_status,
    father_name,
    father_place_of_birth,
    father_nationality,
    mother_name,
    mother_place_of_birth,
    mother_nationality,
    religion,
    declaration_text,
    declaration_signed_by,
    declaration_signed_at,
    user_role,
    status,
    children,
    education,
    next_of_kin,
    projects,
    tin_no,
    spouse_name,
    spouse_contacts,
    passport_photo_url
  ) VALUES (
    p_user_id,
    auth.uid(),
    COALESCE(p_profile_data->>'name_full', 'Unknown'),
    COALESCE(p_profile_data->>'national_id', 'N/A'),
    COALESCE(p_profile_data->>'employee_id', 'N/A'),
    COALESCE(p_profile_data->>'contact_address', 'Unknown'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_profile_data->'mobile_phones', to_jsonb(ARRAY[p_profile_data->>'mobile_phone']::text[]))))::text[], ARRAY[]::text[]),
    COALESCE(p_profile_data->>'designation', 'Unknown'),
    COALESCE(p_profile_data->>'place_of_work', 'Unknown'),
    COALESCE(p_profile_data->>'terms_of_service', 'contract'),
    COALESCE(p_profile_data->>'nationality', 'Unknown'),
    COALESCE(p_profile_data->>'place_of_birth', 'Unknown'),
    COALESCE((p_profile_data->>'date_of_birth')::date, CURRENT_DATE),
    COALESCE((p_profile_data->>'date_of_appointment')::date, CURRENT_DATE),
    COALESCE(p_profile_data->>'marital_status', 'single'),
    COALESCE(p_profile_data->>'father_name', 'Unknown'),
    COALESCE(p_profile_data->>'father_place_of_birth', 'Unknown'),
    COALESCE(p_profile_data->>'father_nationality', COALESCE(p_profile_data->>'nationality', 'Unknown')),
    COALESCE(p_profile_data->>'mother_name', 'Unknown'),
    COALESCE(p_profile_data->>'mother_place_of_birth', 'Unknown'),
    COALESCE(p_profile_data->>'mother_nationality', COALESCE(p_profile_data->>'nationality', 'Unknown')),
    COALESCE(p_profile_data->>'religion', 'Unknown'),
    COALESCE(p_profile_data->>'declaration_text', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.'),
    COALESCE(p_profile_data->>'declaration_signed_by', COALESCE(p_profile_data->>'name_full', 'System')),
    COALESCE((p_profile_data->>'declaration_signed_at')::date, CURRENT_DATE),
    COALESCE(p_profile_data->>'user_role', 'employee'),
    COALESCE(p_profile_data->>'status', 'active'),
    COALESCE(p_profile_data->'children', '[]'::jsonb),
    COALESCE(p_profile_data->'education', '[]'::jsonb),
    COALESCE(p_profile_data->'next_of_kin', '[]'::jsonb),
    COALESCE(p_profile_data->'projects', '[]'::jsonb),
    NULLIF(p_profile_data->>'tin_no', ''),
    NULLIF(p_profile_data->>'spouse_name', ''),
    NULLIF(p_profile_data->>'spouse_contacts', ''),
    NULLIF(p_profile_data->>'passport_photo_url', '')
  ) RETURNING id INTO result_id;

  RETURN jsonb_build_object('success', true, 'id', result_id, 'message', 'Employee profile created successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Database error: ' || SQLERRM);
END;
$$;

-- Defaults enforcement trigger function
CREATE OR REPLACE FUNCTION public.update_employee_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Arrays
  IF NEW.mobile_phones IS NULL THEN NEW.mobile_phones := ARRAY[]::text[]; END IF;
  IF NEW.children IS NULL THEN NEW.children := '[]'::jsonb; END IF;
  IF NEW.education IS NULL THEN NEW.education := '[]'::jsonb; END IF;
  IF NEW.next_of_kin IS NULL THEN NEW.next_of_kin := '[]'::jsonb; END IF;
  IF NEW.projects IS NULL THEN NEW.projects := '[]'::jsonb; END IF;

  -- Text defaults
  IF NEW.status IS NULL OR NEW.status = '' THEN NEW.status := 'active'; END IF;
  IF NEW.user_role IS NULL OR NEW.user_role = '' THEN NEW.user_role := 'employee'; END IF;
  IF NEW.declaration_text IS NULL OR NEW.declaration_text = '' THEN
    NEW.declaration_text := 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.';
  END IF;
  IF NEW.declaration_signed_by IS NULL OR NEW.declaration_signed_by = '' THEN
    NEW.declaration_signed_by := COALESCE(NEW.name_full, 'System');
  END IF;
  IF NEW.declaration_signed_at IS NULL THEN NEW.declaration_signed_at := CURRENT_DATE; END IF;

  RETURN NEW;
END;
$$;

-- Recreate triggers safely
DROP TRIGGER IF EXISTS trg_employee_profiles_defaults ON public.employee_profiles;
CREATE TRIGGER trg_employee_profiles_defaults
BEFORE INSERT ON public.employee_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_employee_profile_defaults();

DROP TRIGGER IF EXISTS trg_employee_profiles_set_updated_at ON public.employee_profiles;
CREATE TRIGGER trg_employee_profiles_set_updated_at
BEFORE UPDATE ON public.employee_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_employee_profile_timestamp();