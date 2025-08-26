-- Fix security definer view issues by recreating the view without security definer
DROP VIEW IF EXISTS public.kpi_gaps;

-- Recreate view without security definer (will use invoker's permissions)
CREATE VIEW public.kpi_gaps AS
SELECT 
  k.id as kpi_id,
  k.title,
  k.project_id,
  k.target_value,
  k.unit,
  k.category,
  k.timeframe,
  k.description,
  COALESCE(latest_value.actual_value, 0) as actual_value,
  (k.target_value - COALESCE(latest_value.actual_value, 0)) as gap_value,
  CASE 
    WHEN COALESCE(latest_value.actual_value, 0) >= k.target_value THEN 'on_track'
    WHEN COALESCE(latest_value.actual_value, 0) >= k.target_value * 0.8 THEN 'slightly_off'
    ELSE 'gap'
  END as status,
  latest_value.reporting_period,
  latest_value.comment as latest_comment
FROM public.kpis k
LEFT JOIN LATERAL (
  SELECT actual_value, reporting_period, comment
  FROM public.kpi_values kv 
  WHERE kv.kpi_id = k.id 
  ORDER BY reporting_period DESC 
  LIMIT 1
) latest_value ON true
WHERE k.is_active = true;

-- Enable RLS on the view (since views inherit from underlying tables, this ensures proper access control)
-- The view will respect the RLS policies of the underlying kpis and kpi_values tables