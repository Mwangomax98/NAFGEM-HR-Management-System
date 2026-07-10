-- Field report attachments
ALTER TABLE public.field_activity_reports
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;
