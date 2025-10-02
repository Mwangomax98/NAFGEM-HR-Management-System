-- Fix Security Definer Views by recreating them without SECURITY DEFINER
-- This ensures RLS policies are enforced based on the querying user, not the view creator

-- Drop and recreate conversation_summaries view
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

CREATE VIEW public.conversation_summaries AS
WITH conversation_stats AS (
  SELECT 
    task_evaluation_id,
    conversation_type,
    conversation_title,
    COUNT(*) AS message_count,
    COUNT(*) FILTER (WHERE is_read = false) AS unread_count,
    MAX(created_at) AS last_message_at,
    array_agg(DISTINCT sender_id) AS participants,
    (array_agg(message ORDER BY created_at DESC))[1] AS last_message,
    related_record_id,
    related_record_type
  FROM task_conversations
  WHERE message_type = ANY(ARRAY['text'::text, 'system'::text])
  GROUP BY 
    task_evaluation_id, 
    conversation_type, 
    conversation_title, 
    related_record_id, 
    related_record_type
)
SELECT 
  task_evaluation_id,
  conversation_type,
  conversation_title,
  message_count,
  unread_count,
  last_message_at,
  participants,
  last_message,
  related_record_id,
  related_record_type
FROM conversation_stats;

-- Drop and recreate kpi_gaps view
DROP VIEW IF EXISTS public.kpi_gaps CASCADE;

CREATE VIEW public.kpi_gaps AS
SELECT 
  k.id AS kpi_id,
  k.title,
  k.project_id,
  k.target_value,
  k.unit,
  k.category,
  k.timeframe,
  k.description,
  COALESCE(latest_value.actual_value, 0) AS actual_value,
  (k.target_value - COALESCE(latest_value.actual_value, 0)) AS gap_value,
  CASE
    WHEN COALESCE(latest_value.actual_value, 0) >= k.target_value THEN 'on_track'
    WHEN COALESCE(latest_value.actual_value, 0) >= (k.target_value * 0.8) THEN 'slightly_off'
    ELSE 'gap'
  END AS status,
  latest_value.reporting_period,
  latest_value.comment AS latest_comment
FROM kpis k
LEFT JOIN LATERAL (
  SELECT 
    kv.actual_value,
    kv.reporting_period,
    kv.comment
  FROM kpi_values kv
  WHERE kv.kpi_id = k.id
  ORDER BY kv.reporting_period DESC
  LIMIT 1
) latest_value ON true
WHERE k.is_active = true;

-- Drop and recreate weekly_target_progress view
DROP VIEW IF EXISTS public.weekly_target_progress CASCADE;

CREATE VIEW public.weekly_target_progress AS
SELECT 
  wt.id,
  wt.kpi_id,
  wt.week_start_date,
  wt.week_end_date,
  wt.target_value,
  wt.assigned_to,
  wt.title,
  wt.description,
  wt.priority,
  wt.status,
  wt.created_by,
  wt.created_at,
  wt.updated_at,
  COALESCE(SUM(ts.completion_percentage), 0) AS total_progress,
  COUNT(ts.id) AS task_count,
  p.full_name AS assigned_to_name,
  k.title AS kpi_title,
  k.unit AS kpi_unit
FROM weekly_targets wt
LEFT JOIN task_submissions ts ON wt.id = ts.weekly_target_id
LEFT JOIN profiles p ON wt.assigned_to = p.id
LEFT JOIN kpis k ON wt.kpi_id = k.id
GROUP BY wt.id, p.full_name, k.title, k.unit;

-- Add RLS policies to weekly_target_progress view
-- Note: RLS on views enforces the underlying table policies
ALTER VIEW public.weekly_target_progress SET (security_invoker = true);
ALTER VIEW public.conversation_summaries SET (security_invoker = true);
ALTER VIEW public.kpi_gaps SET (security_invoker = true);

-- Add comments for documentation
COMMENT ON VIEW public.weekly_target_progress IS 'Aggregated view of weekly targets with progress tracking. Uses security_invoker to enforce RLS policies of querying user.';
COMMENT ON VIEW public.conversation_summaries IS 'Aggregated view of task conversations with message statistics. Uses security_invoker to enforce RLS policies of querying user.';
COMMENT ON VIEW public.kpi_gaps IS 'Calculated view of KPI gaps and status. Uses security_invoker to enforce RLS policies of querying user.';