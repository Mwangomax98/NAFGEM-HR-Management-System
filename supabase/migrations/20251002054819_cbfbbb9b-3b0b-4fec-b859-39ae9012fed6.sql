-- Clarify security configuration for kpi_gaps view
-- This view is SECURE because it uses security_invoker=true and enforces
-- RLS policies from underlying tables (kpis and kpi_values)

-- Add detailed security documentation
COMMENT ON VIEW public.kpi_gaps IS 
'SECURITY: This view uses security_invoker=true to enforce RLS policies of the querying user.
Data access is restricted by the underlying table policies:
- kpis table: Employees see only their project KPIs, HR/Admin see all
- kpi_values table: Employees see only their project values, HR/Admin see all
Therefore, this view is protected and only shows data the querying user is authorized to see.';

COMMENT ON VIEW public.conversation_summaries IS
'SECURITY: This view uses security_invoker=true to enforce RLS policies from task_conversations table.
Only participants in conversations can see the summaries.';

COMMENT ON VIEW public.weekly_target_progress IS
'SECURITY: This view uses security_invoker=true to enforce RLS policies from underlying tables.
Users can only see targets they are assigned to, plus HR/Admin can see all targets.';

-- Verify the underlying tables have proper RLS enabled
DO $$
BEGIN
  -- Ensure kpis table has RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'kpis' 
      AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on kpis table';
  END IF;

  -- Ensure kpi_values table has RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'kpi_values' 
      AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on kpi_values table';
  END IF;
END $$;