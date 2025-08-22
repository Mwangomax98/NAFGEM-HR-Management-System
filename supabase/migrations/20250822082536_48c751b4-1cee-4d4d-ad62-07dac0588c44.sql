-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their conversations" ON task_conversations;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON task_conversations;

-- Create simplified policies without recursion
CREATE POLICY "Users can view messages they sent" 
ON task_conversations 
FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view messages in task evaluations they're involved in" 
ON task_conversations 
FOR SELECT 
USING (
  conversation_type = 'task_related' AND
  EXISTS (
    SELECT 1 FROM task_evaluations te
    JOIN task_submissions ts ON te.task_submission_id = ts.id
    JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
    WHERE te.id = task_conversations.task_evaluation_id
    AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  )
);

CREATE POLICY "Users can view general conversations" 
ON task_conversations 
FOR SELECT 
USING (
  conversation_type IN ('general', 'performance', 'leave', 'training') AND
  (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'))
);

CREATE POLICY "Users can send messages as themselves" 
ON task_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can send task-related messages if involved"
ON task_conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    (conversation_type = 'task_related' AND
     EXISTS (
       SELECT 1 FROM task_evaluations te
       JOIN task_submissions ts ON te.task_submission_id = ts.id
       JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
       WHERE te.id = task_conversations.task_evaluation_id
       AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
     )) OR
    (conversation_type IN ('general', 'performance', 'leave', 'training') AND
     (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee')))
  )
);