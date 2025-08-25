-- Security Fix 1: Since conversation_summaries is a view, secure the underlying task_conversations table instead
-- The view inherits security from the underlying table, so we focus on task_conversations policies

-- Security Fix 2: Prevent users from modifying their own roles
DROP POLICY IF EXISTS "Users cannot modify their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete their own roles" ON public.user_roles;

CREATE POLICY "Users cannot modify their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() != user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users cannot delete their own roles" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() != user_id AND has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 3: Add audit table for role changes
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role app_role,
  new_role app_role,
  changed_by uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('assigned', 'revoked', 'modified')),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs" 
ON public.role_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can create audit logs" 
ON public.role_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Security Fix 4: Add trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, new_role, changed_by, action)
    VALUES (NEW.user_id, NEW.role, COALESCE(NEW.assigned_by, auth.uid()), 'assigned');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, action)
    VALUES (NEW.user_id, OLD.role, NEW.role, auth.uid(), 'modified');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, changed_by, action)
    VALUES (OLD.user_id, OLD.role, auth.uid(), 'revoked');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER role_changes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();

-- Security Fix 5: Add session security table for monitoring
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout', 'permission_denied', 'data_access', 'role_change')),
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can log security events
CREATE POLICY "System can log security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Security Fix 6: Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Fix 7: Strengthen task conversations policies to prevent unauthorized access
-- Add more restrictive policies for task conversations
DROP POLICY IF EXISTS "Users can send task-related messages if involved" ON public.task_conversations;

CREATE POLICY "Users can send task-related messages if involved" 
ON public.task_conversations 
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
     ))
    OR 
    (conversation_type IN ('general', 'performance', 'leave', 'training') AND
     (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role)))
  )
);

-- Security Fix 8: Add validation to prevent timesheet manipulation
CREATE OR REPLACE FUNCTION public.validate_timesheet_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing employee_id after creation
  IF TG_OP = 'UPDATE' AND OLD.employee_id != NEW.employee_id THEN
    RAISE EXCEPTION 'Cannot change timesheet owner';
  END IF;
  
  -- Prevent backdating submissions beyond 30 days
  IF NEW.status = 'submitted' AND NEW.week_end_date < CURRENT_DATE - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Cannot submit timesheets older than 30 days';
  END IF;
  
  -- Log timesheet status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'data_access',
      jsonb_build_object(
        'action', 'timesheet_status_change',
        'timesheet_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'employee_id', NEW.employee_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER timesheet_integrity_trigger
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.validate_timesheet_integrity();