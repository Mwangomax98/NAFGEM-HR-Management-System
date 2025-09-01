-- Add RLS policies for conversation_summaries to ensure users only see conversations they participate in
CREATE POLICY "Users can view conversations they participate in"
ON conversation_summaries
FOR SELECT
USING (
  auth.uid() = ANY(participants)
);

-- Add RLS policy for task_conversations to ensure proper message access control
CREATE POLICY "Users can view messages in conversations they participate in"
ON task_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_summaries cs
    WHERE cs.conversation_title = task_conversations.conversation_title
    AND auth.uid() = ANY(cs.participants)
  )
  OR auth.uid() = sender_id
);

-- Update task_conversations insert policy to check participation
DROP POLICY IF EXISTS "Users can send task-related messages if involved" ON task_conversations;
CREATE POLICY "Users can send messages in conversations they participate in"
ON task_conversations
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- For task-related conversations, check if user is involved in the task
    (conversation_type = 'task_related' AND EXISTS (
      SELECT 1 FROM task_evaluations te
      JOIN task_submissions ts ON te.task_submission_id = ts.id
      JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
      WHERE te.id = task_conversations.task_evaluation_id
      AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
    ))
    OR
    -- For other conversation types, check if user is a participant
    (conversation_type != 'task_related' AND EXISTS (
      SELECT 1 FROM conversation_summaries cs
      WHERE cs.conversation_title = task_conversations.conversation_title
      AND auth.uid() = ANY(cs.participants)
    ))
  )
);