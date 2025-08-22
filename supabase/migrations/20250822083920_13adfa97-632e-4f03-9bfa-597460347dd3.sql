-- Add DELETE policies for task_conversations
CREATE POLICY "Users can delete their own messages" 
ON public.task_conversations 
FOR DELETE 
USING (auth.uid() = sender_id);

CREATE POLICY "HR and Admin can delete any message" 
ON public.task_conversations 
FOR DELETE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));