-- Create storage buckets for employee profile photos and education certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('education-certificates', 'education-certificates', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]);

-- RLS policies for profile-photos bucket
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "HR and Admin can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "HR and Admin can update profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "HR and Admin can delete profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- RLS policies for education-certificates bucket
CREATE POLICY "Anyone can view education certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'education-certificates');

CREATE POLICY "HR and Admin can upload education certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'education-certificates' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "HR and Admin can update education certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'education-certificates' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "HR and Admin can delete education certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'education-certificates' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);