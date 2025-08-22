-- Fix the function to have proper search path security
CREATE OR REPLACE FUNCTION validate_task_conversation_fkey()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate foreign key for task-related conversations
  IF NEW.conversation_type = 'task_related' THEN
    IF NOT EXISTS (SELECT 1 FROM public.task_evaluations WHERE id = NEW.task_evaluation_id) THEN
      RAISE EXCEPTION 'task_evaluation_id must exist in task_evaluations for task_related conversations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;