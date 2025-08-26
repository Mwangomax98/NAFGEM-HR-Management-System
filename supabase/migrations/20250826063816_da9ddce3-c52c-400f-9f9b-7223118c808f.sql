-- Add enhanced fields to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN planned_completion_date date,
ADD COLUMN actual_completion_date date,
ADD COLUMN completion_explanation text,
ADD COLUMN task_category text DEFAULT 'general';

-- Create a trigger to automatically set actual_completion_date when task is completed
CREATE OR REPLACE FUNCTION public.update_task_completion_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If task is being marked as completed and actual_completion_date is not set
  IF NEW.completion_status = 'completed' AND OLD.completion_status != 'completed' AND NEW.actual_completion_date IS NULL THEN
    NEW.actual_completion_date = CURRENT_DATE;
  END IF;
  
  -- If task is being unmarked as completed, clear the actual_completion_date
  IF NEW.completion_status != 'completed' AND OLD.completion_status = 'completed' THEN
    NEW.actual_completion_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic completion date tracking
CREATE TRIGGER trigger_update_task_completion_date
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_completion_date();