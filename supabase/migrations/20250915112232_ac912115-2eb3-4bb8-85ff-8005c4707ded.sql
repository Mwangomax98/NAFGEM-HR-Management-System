-- Create conversation participants table for better conversation management
CREATE TABLE public.conversation_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS on conversation participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation participants
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can join conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR and Admin can manage conversation participants" 
ON public.conversation_participants 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add conversation_id to task_conversations for better organization
ALTER TABLE public.task_conversations 
ADD COLUMN conversation_id UUID DEFAULT gen_random_uuid();

-- Create index for better performance
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_task_conversations_conversation_id ON public.task_conversations(conversation_id);