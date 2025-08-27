-- Critical Security Fixes: Phase 1 - RLS Policies and Role Protection

-- 1. Enable RLS on exposed tables
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_target_progress ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for conversation_summaries
CREATE POLICY "HR and Admin can view all conversation summaries"
ON public.conversation_summaries
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view task-related conversations they're involved in"
ON public.conversation_summaries
FOR SELECT
USING (
  conversation_type = 'task_related' AND 
  EXISTS (
    SELECT 1 FROM task_evaluations te
    JOIN task_submissions ts ON te.task_submission_id = ts.id
    JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
    WHERE te.id = conversation_summaries.task_evaluation_id
    AND (wt.employee_id = auth.uid() OR te.evaluator_id = auth.uid())
  )
);

-- 3. Add RLS policies for kpi_gaps
CREATE POLICY "HR and Admin can view all KPI gaps"
ON public.kpi_gaps
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view KPI gaps for their project"
ON public.kpi_gaps
FOR SELECT
USING (
  project_id = (
    SELECT project FROM profiles WHERE id = auth.uid()
  )
);

-- 4. Add RLS policies for weekly_target_progress
CREATE POLICY "HR and Admin can view all weekly target progress"
ON public.weekly_target_progress
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own weekly target progress"
ON public.weekly_target_progress
FOR SELECT
USING (assigned_to = auth.uid());

-- 5. Fix role self-assignment vulnerability
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users cannot modify their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete their own roles" ON public.user_roles;

-- Create secure role management policies
CREATE POLICY "Only admins can assign/modify roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role only"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 6. Add role change validation trigger
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from modifying their own roles
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
  END IF;
  
  -- Prevent non-admins from assigning admin roles
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'admin' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  -- Log critical role changes
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_assignment',
      jsonb_build_object(
        'target_user', NEW.user_id,
        'role_assigned', NEW.role,
        'assigned_by', NEW.assigned_by
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_modification',
      jsonb_build_object(
        'target_user', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_revocation',
      jsonb_build_object(
        'target_user', OLD.user_id,
        'role_revoked', OLD.role
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_role_changes_trigger ON public.user_roles;
CREATE TRIGGER validate_role_changes_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_changes();

-- 7. Add data integrity constraints
ALTER TABLE public.kpi_values
ADD CONSTRAINT check_actual_value_positive 
CHECK (actual_value >= 0);

ALTER TABLE public.weekly_targets
ADD CONSTRAINT check_target_value_positive 
CHECK (target_value >= 0);

ALTER TABLE public.timesheet_entries
ADD CONSTRAINT check_hours_worked_valid 
CHECK (hours_worked >= 0 AND hours_worked <= 24);

-- 8. Enhance security event logging for critical tables
CREATE OR REPLACE FUNCTION public.log_critical_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables
  IF TG_TABLE_NAME IN ('user_roles', 'security_events', 'role_audit_log') THEN
    PERFORM log_security_event(
      auth.uid(),
      'sensitive_data_access',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply logging triggers
CREATE TRIGGER log_user_roles_access
  AFTER SELECT ON public.user_roles
  FOR EACH STATEMENT EXECUTE FUNCTION public.log_critical_data_access();

CREATE TRIGGER log_security_events_access
  AFTER SELECT ON public.security_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.log_critical_data_access();