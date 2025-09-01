-- Create storage bucket for exit attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('exit-attachments', 'exit-attachments', false);

-- Create exit_attachments table
CREATE TABLE public.exit_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exit_request_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on exit_attachments
ALTER TABLE public.exit_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for exit_attachments
CREATE POLICY "Users can upload attachments for their exit requests" 
ON public.exit_attachments 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND 
  EXISTS (
    SELECT 1 FROM exit_requests 
    WHERE id = exit_attachments.exit_request_id 
    AND employee_id = auth.uid()
  )
);

CREATE POLICY "Users can view attachments for their exit requests" 
ON public.exit_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM exit_requests 
    WHERE id = exit_attachments.exit_request_id 
    AND (
      employee_id = auth.uid() OR 
      has_role(auth.uid(), 'hr'::app_role) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "HR and Admin can manage all exit attachments" 
ON public.exit_attachments 
FOR ALL 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for exit-attachments bucket
CREATE POLICY "Users can upload their own exit attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'exit-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own exit attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'exit-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "HR and Admin can view all exit attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'exit-attachments' AND 
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can update their own exit attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'exit-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own exit attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'exit-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);