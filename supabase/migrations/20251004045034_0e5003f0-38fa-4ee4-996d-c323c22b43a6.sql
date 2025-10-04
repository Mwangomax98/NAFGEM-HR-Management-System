-- Fix security issue: Restrict driver personal information access
-- Remove public employee access to driver data containing sensitive PII
-- Only HR and Admin should be able to view driver personal information

DROP POLICY IF EXISTS "Employees can view drivers" ON public.drivers;

-- Note: The existing "Admin and HR can manage all drivers" policy already 
-- allows HR and Admin to SELECT (view) driver data, so no additional policy needed
-- This ensures only authorized personnel (HR/Admin) can access driver PII