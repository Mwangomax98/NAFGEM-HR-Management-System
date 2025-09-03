-- PHASE 3: FIX REMAINING SECURITY ISSUES

-- Fix all remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.create_default_exit_checklist(exit_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.exit_checklist_items (exit_request_id, task_title, task_description, order_index) VALUES
    (exit_request_id, 'Submit resignation letter', 'Formal resignation with notice period', 1),
    (exit_request_id, 'Complete handover documentation', 'Document ongoing projects and responsibilities', 2),
    (exit_request_id, 'Return company equipment', 'Laptop, ID badge, and other company property', 3),
    (exit_request_id, 'Final timesheet submission', 'Submit timesheet for your last period', 4),
    (exit_request_id, 'Exit interview scheduling', 'Schedule exit interview with HR', 5),
    (exit_request_id, 'Benefits and final pay discussion', 'Review final compensation and benefits', 6);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_timesheet_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_name text;
  payload jsonb;
BEGIN
  -- Determine which function to call based on table name
  CASE TG_TABLE_NAME
    WHEN 'leave_requests' THEN
      function_name := 'notify-leave-status';
    WHEN 'trip_requests' THEN
      function_name := 'notify-trip-status';
    WHEN 'timesheets' THEN
      function_name := 'notify-timesheet-status';
    ELSE
      RETURN COALESCE(NEW, OLD);
  END CASE;

  -- Prepare payload
  payload := jsonb_build_object(
    'record', to_jsonb(NEW),
    'old_record', to_jsonb(OLD)
  );

  -- Call the edge function asynchronously using pg_net extension
  -- Note: In production, you might want to use a queue system for better reliability
  PERFORM net.http_post(
    url := 'https://fhuugwswibusywfcbaqq.supabase.co/functions/v1/' || function_name,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_type text := 'info';
  notification_title text;
  notification_message text;
  target_user_id uuid;
BEGIN
  -- Determine target user and notification details based on table and status
  CASE TG_TABLE_NAME
    WHEN 'leave_requests' THEN
      target_user_id := NEW.requester_id;
      CASE NEW.status
        WHEN 'approved' THEN
          notification_type := 'success';
          notification_title := 'Leave Request Approved';
          notification_message := 'Your leave request (' || NEW.ref_number || ') has been approved.';
        WHEN 'rejected' THEN
          notification_type := 'error';
          notification_title := 'Leave Request Rejected';
          notification_message := 'Your leave request (' || NEW.ref_number || ') has been rejected.';
        WHEN 'pending' THEN
          notification_type := 'info';
          notification_title := 'Leave Request Submitted';
          notification_message := 'Your leave request (' || NEW.ref_number || ') has been submitted for review.';
        ELSE
          RETURN NEW;
      END CASE;
      
    WHEN 'trip_requests' THEN
      target_user_id := NEW.requester_id;
      CASE NEW.status
        WHEN 'approved' THEN
          notification_type := 'success';
          notification_title := 'Trip Request Approved';
          notification_message := 'Your trip to ' || NEW.destination || ' has been approved.';
        WHEN 'rejected' THEN
          notification_type := 'error';
          notification_title := 'Trip Request Rejected';
          notification_message := 'Your trip request to ' || NEW.destination || ' has been rejected.';
        WHEN 'confirmed' THEN
          notification_type := 'success';
          notification_title := 'Trip Confirmed';
          notification_message := 'Your trip to ' || NEW.destination || ' has been confirmed with driver and vehicle assigned.';
        ELSE
          RETURN NEW;
      END CASE;
      
    WHEN 'timesheets' THEN
      target_user_id := NEW.employee_id;
      CASE NEW.status
        WHEN 'approved' THEN
          notification_type := 'success';
          notification_title := 'Timesheet Approved';
          notification_message := 'Your timesheet for ' || NEW.week_start_date || ' - ' || NEW.week_end_date || ' has been approved.';
        WHEN 'rejected' THEN
          notification_type := 'error';
          notification_title := 'Timesheet Rejected';
          notification_message := 'Your timesheet for ' || NEW.week_start_date || ' - ' || NEW.week_end_date || ' has been rejected.';
        WHEN 'submitted' THEN
          notification_type := 'info';
          notification_title := 'Timesheet Submitted';
          notification_message := 'Your timesheet for ' || NEW.week_start_date || ' - ' || NEW.week_end_date || ' has been submitted for review.';
        ELSE
          RETURN NEW;
      END CASE;
      
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, message, read)
  VALUES (target_user_id, notification_type, notification_title, notification_message, false);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  RAISE WARNING 'Failed to create notification: %', SQLERRM;
  RETURN NEW;
END;
$$;