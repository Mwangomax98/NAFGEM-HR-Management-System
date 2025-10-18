-- Update the National ID for itofficernafgem@gmail.com employee profile
UPDATE employee_profiles
SET 
  national_id = '19980925535150000129',
  updated_at = now()
WHERE id = '86219870-ba0c-41b3-95c6-781784235a8b'
  AND user_id = '563912e0-871e-4dcd-9525-47a3985848a8';