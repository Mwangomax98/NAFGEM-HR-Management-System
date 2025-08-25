-- Fix role system issues

-- 1. Assign employee roles to users who don't have any roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'employee'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL;

-- 2. Add missing RLS policies for conversation_summaries table
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- Allow HR and Admin to view all conversation summaries
CREATE POLICY "HR and Admin can view all conversation summaries"
ON public.conversation_summaries
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow employees to view conversation summaries they're involved in
CREATE POLICY "Employees can view their conversation summaries"
ON public.conversation_summaries
FOR SELECT
USING (
  has_role(auth.uid(), 'employee'::app_role) AND (
    -- For task-related conversations, check if user is involved in the task
    (conversation_type = 'task_related' AND EXISTS (
      SELECT 1 FROM task_evaluations te
      JOIN task_submissions ts ON te.task_submission_id = ts.id
      JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
      WHERE te.id = conversation_summaries.task_evaluation_id
      AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
    ))
    OR
    -- For general conversations, allow all employees
    conversation_type IN ('general', 'performance', 'leave', 'training')
  )
);

-- 3. Improve role assignment security - add validation trigger
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent users from assigning roles to themselves
  IF auth.uid() = NEW.user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  
  -- Only admin can assign admin roles
  IF NEW.role = 'admin' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign admin roles';
  END IF;
  
  -- Log the role assignment attempt
  PERFORM log_security_event(
    auth.uid(),
    'role_assignment',
    jsonb_build_object(
      'target_user_id', NEW.user_id,
      'assigned_role', NEW.role,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();