-- Fix RLS for task_conversations to avoid recursion and ensure participants can view messages
-- Drop outdated/recursive policies
DROP POLICY IF EXISTS "Users can view general conversations" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can view messages in task evaluations they're involved in" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can view personal conversations they participate in" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can view messages they sent" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can send task-related messages if involved" ON public.task_conversations;
DROP POLICY IF EXISTS "Users can create personal conversations" ON public.task_conversations;

-- Create new safe, participant-based policies
CREATE POLICY "Users can view messages in conversations they participate in" 
ON public.task_conversations 
FOR SELECT 
USING (
  -- Sender can always view their own messages
  auth.uid() = sender_id 
  OR 
  -- If conversation_id is set, ensure user participates in that conversation
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = task_conversations.conversation_id 
      AND cp.user_id = auth.uid()
  ))
  OR
  -- Backward compatibility for legacy task-related messages
  (task_evaluation_id IS NOT NULL AND conversation_type = 'task_related' AND EXISTS (
    SELECT 1 FROM ((public.task_evaluations te
      JOIN public.task_submissions ts ON te.task_submission_id = ts.id)
      JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id)
    WHERE te.id = task_conversations.task_evaluation_id 
      AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  ))
);

CREATE POLICY "Users can send messages in conversations they participate in" 
ON public.task_conversations 
FOR INSERT 
WITH CHECK (
  -- Must be the sender
  auth.uid() = sender_id 
  AND (
    -- New conversation system: must be a participant for the conversation_id
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = task_conversations.conversation_id 
        AND cp.user_id = auth.uid()
    ))
    OR
    -- Legacy task-related flow: keep original allowance
    (task_evaluation_id IS NOT NULL AND (
      (conversation_type = 'task_related' AND EXISTS (
        SELECT 1 FROM ((public.task_evaluations te
          JOIN public.task_submissions ts ON te.task_submission_id = ts.id)
          JOIN public.weekly_tasks wt ON ts.weekly_task_id = wt.id)
        WHERE te.id = task_conversations.task_evaluation_id 
          AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
      ))
      OR
      (conversation_type = ANY (ARRAY['general', 'performance', 'leave', 'training']) 
       AND has_role(auth.uid(), 'employee'::app_role))
    ))
  )
);

CREATE POLICY "HR and Admin can manage all conversations" 
ON public.task_conversations 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));