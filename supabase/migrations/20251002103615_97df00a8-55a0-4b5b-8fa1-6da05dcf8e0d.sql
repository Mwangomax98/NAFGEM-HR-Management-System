-- Phase 3: Expand Notification Coverage
-- Add triggers for task evaluations, weekly targets, exit requests, and profile updates

-- Trigger for task evaluations
CREATE OR REPLACE FUNCTION notify_task_evaluation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  employee_user_id uuid;
  task_title text;
BEGIN
  -- Get the employee who submitted the task
  SELECT wt.employee_id, ts.task_title INTO employee_user_id, task_title
  FROM task_submissions ts
  JOIN weekly_tasks wt ON ts.weekly_task_id = wt.id
  WHERE ts.id = NEW.task_submission_id;

  -- Create notification for the employee
  INSERT INTO notifications (user_id, type, title, message, read)
  VALUES (
    employee_user_id,
    CASE 
      WHEN NEW.performance_score >= 4 THEN 'success'
      WHEN NEW.performance_score >= 3 THEN 'info'
      ELSE 'warning'
    END,
    'Task Evaluation Received',
    'Your task "' || task_title || '" has been evaluated with a score of ' || NEW.performance_score || '/5.',
    false
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER task_evaluation_notification
AFTER INSERT ON task_evaluations
FOR EACH ROW
EXECUTE FUNCTION notify_task_evaluation();

-- Trigger for weekly target assignments
CREATE OR REPLACE FUNCTION notify_weekly_target_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, read)
    VALUES (
      NEW.assigned_to,
      'info',
      'New Weekly Target Assigned',
      'You have been assigned a new weekly target: ' || NEW.title,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER weekly_target_assignment_notification
AFTER INSERT ON weekly_targets
FOR EACH ROW
WHEN (NEW.assigned_to IS NOT NULL)
EXECUTE FUNCTION notify_weekly_target_assignment();

-- Trigger for exit request status changes
CREATE OR REPLACE FUNCTION notify_exit_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, read)
    VALUES (
      NEW.employee_id,
      CASE 
        WHEN NEW.status = 'hr_approved' THEN 'success'
        WHEN NEW.status = 'final_approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      'Exit Request Status Updated',
      'Your exit request status has been updated to: ' || NEW.status,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER exit_request_status_notification
AFTER UPDATE ON exit_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_exit_request_status();

-- Trigger for employee profile updates (notify the employee)
CREATE OR REPLACE FUNCTION notify_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if updated by someone other than the employee themselves
  IF NEW.user_id IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, read)
    VALUES (
      NEW.user_id,
      'info',
      'Profile Updated',
      'Your employee profile has been updated by HR/Admin.',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_update_notification
AFTER UPDATE ON employee_profiles
FOR EACH ROW
EXECUTE FUNCTION notify_profile_update();