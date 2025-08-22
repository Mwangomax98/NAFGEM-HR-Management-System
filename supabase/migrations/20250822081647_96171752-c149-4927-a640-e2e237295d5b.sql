-- Create a dedicated conversations table for general communications
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  conversation_type text NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  related_record_id uuid,
  related_record_type text
);

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    has_role(auth.uid(), 'hr'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'employee'::app_role)
  )
);

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() = created_by OR
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.conversation_messages cm 
    WHERE cm.conversation_id = conversations.id 
    AND cm.sender_id = auth.uid()
  )
);

-- Create a conversation_messages table
CREATE TABLE public.conversation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on conversation_messages table
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_messages
CREATE POLICY "Users can send messages in conversations" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (
        c.created_by = auth.uid() OR
        has_role(auth.uid(), 'hr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  )
);

CREATE POLICY "Users can view messages in their conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (
      c.created_by = auth.uid() OR
      auth.uid() = sender_id OR
      has_role(auth.uid(), 'hr'::app_role) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_type ON public.conversations(conversation_type);
CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sender_id ON public.conversation_messages(sender_id);

-- Create updated conversation summaries view
DROP VIEW IF EXISTS public.conversation_summaries;
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT 
  c.id as conversation_id,
  c.title as conversation_title,
  c.conversation_type,
  c.created_by,
  c.created_at,
  c.related_record_id,
  c.related_record_type,
  COALESCE(COUNT(cm.id), 0) as message_count,
  COALESCE(COUNT(cm.id) FILTER (WHERE cm.is_read = false AND cm.sender_id != c.created_by), 0) as unread_count,
  COALESCE(MAX(cm.created_at), c.created_at) as last_message_at,
  (SELECT cm2.message FROM public.conversation_messages cm2 
   WHERE cm2.conversation_id = c.id 
   ORDER BY cm2.created_at DESC LIMIT 1) as last_message,
  array_agg(DISTINCT cm.sender_id) FILTER (WHERE cm.sender_id IS NOT NULL) as participants
FROM public.conversations c
LEFT JOIN public.conversation_messages cm ON c.id = cm.conversation_id
GROUP BY c.id, c.title, c.conversation_type, c.created_by, c.created_at, c.related_record_id, c.related_record_type;

-- Enable realtime for new tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;