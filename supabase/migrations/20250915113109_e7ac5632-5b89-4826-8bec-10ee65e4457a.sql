-- Drop all existing policies on task_conversations
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'task_conversations' 
          AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.task_conversations';
    END LOOP;
END $$;

-- Create new participant-based policies for conversations
CREATE POLICY "Users can view conversations they participate in" 
ON public.task_conversations 
FOR SELECT 
USING (
  -- User is the sender
  auth.uid() = sender_id 
  OR 
  -- User participates in the conversation (for new conversation system)
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = task_conversations.conversation_id 
      AND user_id = auth.uid()
  ))
  OR
  -- Legacy task-related messages (backward compatibility)
  (task_evaluation_id IS NOT NULL AND conversation_type = 'task_related' AND EXISTS (
    SELECT 1 FROM ((public.task_evaluations te
      JOIN public.task_submissions ts ON te.task_submission_id = ts.id)
      JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id)
    WHERE te.id = task_conversations.task_evaluation_id 
      AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  ))
);

CREATE POLICY "Users can send messages in conversations" 
ON public.task_conversations 
FOR INSERT 
WITH CHECK (
  -- Must be the sender
  auth.uid() = sender_id 
  AND (
    -- For new conversation system: must be a participant
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = task_conversations.conversation_id 
        AND user_id = auth.uid()
    ))
    OR
    -- Legacy task system rules
    (task_evaluation_id IS NOT NULL AND (
      conversation_type = 'task_related' AND EXISTS (
        SELECT 1 FROM ((public.task_evaluations te
          JOIN public.task_submissions ts ON te.task_submission_id = ts.id)
          JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id)
        WHERE te.id = task_conversations.task_evaluation_id 
          AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
      )
    ))
  )
);

CREATE POLICY "HR and Admin can manage all conversations" 
ON public.task_conversations 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));