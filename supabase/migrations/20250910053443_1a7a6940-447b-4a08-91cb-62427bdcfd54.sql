-- CRITICAL SECURITY FIX: Remove the dangerous public access policy
-- First, check and remove the specific dangerous policy
DROP POLICY IF EXISTS "Everyone can view active projects" ON public.projects;

-- Verify the dangerous public policy is removed
-- The remaining secure policies are already in place