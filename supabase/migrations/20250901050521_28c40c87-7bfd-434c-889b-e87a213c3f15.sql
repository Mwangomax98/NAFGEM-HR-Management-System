-- Fix the security definer function to include search_path
DROP FUNCTION IF EXISTS public.create_default_exit_checklist(UUID);

CREATE OR REPLACE FUNCTION public.create_default_exit_checklist(exit_request_id UUID)
RETURNS VOID
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