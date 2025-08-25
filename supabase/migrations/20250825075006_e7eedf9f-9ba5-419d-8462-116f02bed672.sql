-- Fix the security definer view issue
-- The conversation_summaries is a view that should not use SECURITY DEFINER
-- Let's recreate it properly as a regular view

DROP VIEW IF EXISTS public.conversation_summaries;

-- Create conversation_summaries as a regular view (not security definer)
CREATE VIEW public.conversation_summaries AS
SELECT 
  tc.task_evaluation_id,
  tc.related_record_id,
  tc.conversation_type,
  tc.related_record_type,
  tc.conversation_title,
  COUNT(tc.id) as message_count,
  MAX(tc.created_at) as last_message_at,
  ARRAY_AGG(DISTINCT tc.sender_id) as participants,
  MAX(tc.message) as last_message,
  COUNT(CASE WHEN NOT tc.is_read THEN 1 END) as unread_count
FROM public.task_conversations tc
GROUP BY 
  tc.task_evaluation_id,
  tc.related_record_id,
  tc.conversation_type,
  tc.related_record_type,
  tc.conversation_title;

-- Now we can add RLS policies to the underlying task_conversations table
-- which will be inherited by the view