-- Restore missing profiles and roles for all 9 users (final corrected version)
-- Based on auth.users data and role_audit_log history

-- Insert missing profiles
INSERT INTO public.profiles (id, email, full_name, project, title) VALUES
('479c0995-350e-4832-adfd-627a4d6126a8', 'charlesmwangomale1@gmail.com', 'Charles Mwangomale', 'NAFGEM', 'Staff'),
('a0da435e-3a74-49fa-a324-c850693d0138', 'maxcharlz25@gmail.com', 'Max Charles', 'NAFGEM', 'Staff'),
('6e9ad9d8-aa57-4824-a061-eb2c716968fd', 'cmosamenafgemtanzania@gmail.com', 'CM Osama', 'NAFGEM', 'Staff'),
('c37bc5a7-e94c-41e4-901b-02c2cdc8342e', 'cmorombonafgemtanzania@gmail.com', 'CM Orombo', 'NAFGEM', 'Staff'),
('090b59d9-88d4-4312-b3df-ccc9165a9dbe', 'hhokilnafgemtanzania@gmail.com', 'H Hokil', 'NAFGEM', 'Staff'),
('1afb7df1-b88a-4743-8b33-99eb93d9a620', 'mbingalalatareeq20@gmail.com', 'M Bingalala Tareeq', 'NAFGEM', 'Staff'),
('d289dc87-face-4c9c-b5ea-85094393ccb2', 'merkilimanjaro@gmail.com', 'Mer Kilimanjaro', 'NAFGEM', 'Staff'),
('14f447c5-aec5-4116-80c8-185a26da3eae', 'merlkilimanjaro@gmail.com', 'Merl Kilimanjaro', 'NAFGEM', 'Staff'),
('5b76c0bc-78da-47f2-9d41-9db6d850bcb3', 'nafgemhr@gmail.com', 'NAFGEM HR', 'NAFGEM', 'HR Staff')
ON CONFLICT (id) DO NOTHING;

-- Restore user roles based on role_audit_log history
INSERT INTO public.user_roles (user_id, role, assigned_by) VALUES
('479c0995-350e-4832-adfd-627a4d6126a8', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('a0da435e-3a74-49fa-a324-c850693d0138', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('6e9ad9d8-aa57-4824-a061-eb2c716968fd', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('c37bc5a7-e94c-41e4-901b-02c2cdc8342e', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('090b59d9-88d4-4312-b3df-ccc9165a9dbe', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('1afb7df1-b88a-4743-8b33-99eb93d9a620', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('d289dc87-face-4c9c-b5ea-85094393ccb2', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('14f447c5-aec5-4116-80c8-185a26da3eae', 'employee', '563912e0-871e-4dcd-9525-47a3985848a8'),
('5b76c0bc-78da-47f2-9d41-9db6d850bcb3', 'hr', '563912e0-871e-4dcd-9525-47a3985848a8')
ON CONFLICT (user_id) DO NOTHING;

-- Create basic employee profiles for all missing users (with unique national IDs)
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
  projects
) VALUES
('479c0995-350e-4832-adfd-627a4d6126a8', '563912e0-871e-4dcd-9525-47a3985848a8', 'Charles Mwangomale', 'PENDING002', 'EMP002', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'Charles Mwangomale', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('a0da435e-3a74-49fa-a324-c850693d0138', '563912e0-871e-4dcd-9525-47a3985848a8', 'Max Charles', 'PENDING003', 'EMP003', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'Max Charles', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('6e9ad9d8-aa57-4824-a061-eb2c716968fd', '563912e0-871e-4dcd-9525-47a3985848a8', 'CM Osama', 'PENDING004', 'EMP004', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'CM Osama', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('c37bc5a7-e94c-41e4-901b-02c2cdc8342e', '563912e0-871e-4dcd-9525-47a3985848a8', 'CM Orombo', 'PENDING005', 'EMP005', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'CM Orombo', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('090b59d9-88d4-4312-b3df-ccc9165a9dbe', '563912e0-871e-4dcd-9525-47a3985848a8', 'H Hokil', 'PENDING006', 'EMP006', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'H Hokil', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('1afb7df1-b88a-4743-8b33-99eb93d9a620', '563912e0-871e-4dcd-9525-47a3985848a8', 'M Bingalala Tareeq', 'PENDING007', 'EMP007', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'M Bingalala Tareeq', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('d289dc87-face-4c9c-b5ea-85094393ccb2', '563912e0-871e-4dcd-9525-47a3985848a8', 'Mer Kilimanjaro', 'PENDING008', 'EMP008', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'Mer Kilimanjaro', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('14f447c5-aec5-4116-80c8-185a26da3eae', '563912e0-871e-4dcd-9525-47a3985848a8', 'Merl Kilimanjaro', 'PENDING009', 'EMP009', 'Unknown', ARRAY[]::text[], 'Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'Merl Kilimanjaro', CURRENT_DATE, 'employee', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
('5b76c0bc-78da-47f2-9d41-9db6d850bcb3', '563912e0-871e-4dcd-9525-47a3985848a8', 'NAFGEM HR', 'PENDING010', 'EMP010', 'Unknown', ARRAY[]::text[], 'HR Staff', 'NAFGEM', 'Contract', 'Tanzanian', 'Unknown', CURRENT_DATE, CURRENT_DATE, 'Single', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'Unknown', 'Tanzanian', 'Unknown', 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.', 'NAFGEM HR', CURRENT_DATE, 'hr', 'active', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;