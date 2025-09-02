-- Create database triggers to automatically notify users of status changes

-- Function to call edge functions for notifications
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for leave requests
CREATE TRIGGER leave_request_status_change
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_status_change();

-- Create triggers for trip requests  
CREATE TRIGGER trip_request_status_change
  AFTER UPDATE ON public.trip_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_status_change();

-- Create triggers for timesheets
CREATE TRIGGER timesheet_status_change
  AFTER UPDATE ON public.timesheets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_status_change();

-- Create a simpler notification function that doesn't rely on external calls
-- This ensures notifications are created even if edge functions fail
CREATE OR REPLACE FUNCTION public.create_status_notification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the previous triggers with ones that create notifications directly
DROP TRIGGER IF EXISTS leave_request_status_change ON public.leave_requests;
DROP TRIGGER IF EXISTS trip_request_status_change ON public.trip_requests;
DROP TRIGGER IF EXISTS timesheet_status_change ON public.timesheets;

-- Create new triggers for direct notification creation
CREATE TRIGGER leave_request_notification
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_status_notification();

CREATE TRIGGER trip_request_notification
  AFTER UPDATE ON public.trip_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_status_notification();

CREATE TRIGGER timesheet_notification
  AFTER UPDATE ON public.timesheets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_status_notification();