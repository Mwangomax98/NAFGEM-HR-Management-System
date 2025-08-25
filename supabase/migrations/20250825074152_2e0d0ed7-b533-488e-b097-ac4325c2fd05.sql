-- Security Fix 1: Add comprehensive RLS policies to conversation_summaries table
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they participate in
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversation_summaries 
FOR SELECT 
USING (
  auth.uid() = ANY(participants) OR
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Users can create general conversations
CREATE POLICY "Users can create general conversations" 
ON public.conversation_summaries 
FOR INSERT 
WITH CHECK (
  conversation_type IN ('general', 'performance', 'leave', 'training') AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))
);

-- System can create task-related conversations
CREATE POLICY "System can create task conversations" 
ON public.conversation_summaries 
FOR INSERT 
WITH CHECK (
  conversation_type = 'task_related' AND
  task_evaluation_id IS NOT NULL
);

-- HR and Admin can update conversation summaries
CREATE POLICY "HR and Admin can update conversations" 
ON public.conversation_summaries 
FOR UPDATE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- HR and Admin can delete conversations
CREATE POLICY "HR and Admin can delete conversations" 
ON public.conversation_summaries 
FOR DELETE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 2: Prevent users from modifying their own roles
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

-- Security Fix 5: Enhance timesheet security
-- Prevent employees from approving their own timesheets
CREATE POLICY "Employees cannot approve their own timesheets" 
ON public.timesheets 
FOR UPDATE 
USING (
  CASE 
    WHEN status = 'submitted' AND auth.uid() = employee_id THEN false
    ELSE true
  END
);

-- Security Fix 6: Add session security table for monitoring
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

-- Security Fix 7: Add function to log security events
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