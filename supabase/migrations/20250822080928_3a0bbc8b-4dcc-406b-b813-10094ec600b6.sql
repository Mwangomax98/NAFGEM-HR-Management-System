-- Extend task_conversations to support broader communication types
ALTER TABLE public.task_conversations 
ADD COLUMN conversation_type text NOT NULL DEFAULT 'task_related',
ADD COLUMN conversation_title text,
ADD COLUMN related_record_id uuid,
ADD COLUMN related_record_type text;

-- Create index for better performance
CREATE INDEX idx_task_conversations_type_sender ON public.task_conversations(conversation_type, sender_id);
CREATE INDEX idx_task_conversations_related ON public.task_conversations(related_record_id, related_record_type);

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT 
  tc.task_evaluation_id,
  tc.conversation_type,
  tc.conversation_title,
  tc.related_record_id,
  tc.related_record_type,
  COUNT(*) as message_count,
  COUNT(*) FILTER (WHERE tc.is_read = false) as unread_count,
  MAX(tc.created_at) as last_message_at,
  array_agg(DISTINCT tc.sender_id) as participants,
  (SELECT message FROM public.task_conversations tc2 
   WHERE tc2.task_evaluation_id = tc.task_evaluation_id 
   ORDER BY tc2.created_at DESC LIMIT 1) as last_message
FROM public.task_conversations tc
GROUP BY tc.task_evaluation_id, tc.conversation_type, tc.conversation_title, tc.related_record_id, tc.related_record_type;

-- Update RLS policies to support broader communication types
DROP POLICY IF EXISTS "Users can send messages in their task conversations" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can view conversations for their tasks" ON public.task_conversations;

-- New RLS policies for enhanced communications
CREATE POLICY "Users can send messages in their conversations" 
ON public.task_conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Task-related conversations (existing logic)
    (conversation_type = 'task_related' AND EXISTS (
      SELECT 1 FROM ((task_evaluations te
        JOIN task_submissions ts ON (te.task_submission_id = ts.id))
        JOIN weekly_tasks wt ON (ts.weekly_task_id = wt.id))
      WHERE te.id = task_evaluation_id AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
    ))
    OR
    -- General HR-Employee conversations
    (conversation_type IN ('general', 'performance', 'leave', 'training') AND (
      has_role(auth.uid(), 'hr'::app_role) OR 
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'employee'::app_role)
    ))
  )
);

CREATE POLICY "Users can view their conversations" 
ON public.task_conversations 
FOR SELECT 
USING (
  auth.uid() = sender_id OR (
    -- Task-related conversations (existing logic)
    (conversation_type = 'task_related' AND EXISTS (
      SELECT 1 FROM ((task_evaluations te
        JOIN task_submissions ts ON (te.task_submission_id = ts.id))
        JOIN weekly_tasks wt ON (ts.weekly_task_id = wt.id))
      WHERE te.id = task_evaluation_id AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
    ))
    OR
    -- General conversations - users can see conversations they participate in
    (conversation_type IN ('general', 'performance', 'leave', 'training') AND (
      EXISTS (
        SELECT 1 FROM public.task_conversations tc2 
        WHERE tc2.task_evaluation_id = task_conversations.task_evaluation_id 
        AND tc2.sender_id = auth.uid()
      )
      OR has_role(auth.uid(), 'hr'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role)
    ))
  )
);

-- Enable realtime for conversations
ALTER TABLE public.task_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_conversations;