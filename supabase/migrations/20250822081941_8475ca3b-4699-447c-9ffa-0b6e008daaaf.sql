-- Remove the existing foreign key constraint that's preventing general conversations
ALTER TABLE public.task_conversations 
DROP CONSTRAINT IF EXISTS task_conversations_task_evaluation_id_fkey;

-- Make task_evaluation_id nullable so we can have conversations without task evaluations
ALTER TABLE public.task_conversations 
ALTER COLUMN task_evaluation_id DROP NOT NULL;

-- Add a conditional foreign key constraint only for task-related conversations
-- We can't do this directly, so we'll use a trigger to validate
CREATE OR REPLACE FUNCTION validate_task_conversation_fkey()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate foreign key for task-related conversations
  IF NEW.conversation_type = 'task_related' THEN
    IF NOT EXISTS (SELECT 1 FROM public.task_evaluations WHERE id = NEW.task_evaluation_id) THEN
      RAISE EXCEPTION 'task_evaluation_id must exist in task_evaluations for task_related conversations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate the foreign key conditionally
CREATE TRIGGER validate_task_conversation_fkey_trigger
  BEFORE INSERT OR UPDATE ON public.task_conversations
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_conversation_fkey();