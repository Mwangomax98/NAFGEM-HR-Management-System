-- Fix personal conversation creation by updating RLS policies for task_conversations

-- Add RLS policy for personal conversations INSERT
CREATE POLICY "Users can create personal conversations"
ON task_conversations
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND 
  conversation_type IN ('personal', 'general', 'performance', 'leave', 'training')
);

-- Add RLS policy for personal conversations SELECT
CREATE POLICY "Users can view personal conversations they participate in"
ON task_conversations
FOR SELECT
USING (
  -- Users can see conversations where they are the sender
  auth.uid() = sender_id OR
  -- Users can see general conversations if they have appropriate role
  (conversation_type IN ('general', 'performance', 'leave', 'training') AND 
   (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))) OR
  -- Users can see personal conversations where they are mentioned in the conversation_title or participants
  (conversation_type = 'personal' AND 
   EXISTS (
     SELECT 1 FROM task_conversations tc2 
     WHERE tc2.task_evaluation_id = task_conversations.task_evaluation_id 
     AND tc2.sender_id = auth.uid()
   ))
);