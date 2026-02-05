-- Create storage bucket for provider certifications
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', false);

-- Allow authenticated users to upload their own certifications
CREATE POLICY "Users can upload their own certifications"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own certifications
CREATE POLICY "Users can view their own certifications"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own certifications
CREATE POLICY "Users can delete their own certifications"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add provider-specific columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_skill TEXT,
ADD COLUMN IF NOT EXISTS service_location TEXT,
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS certification_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';