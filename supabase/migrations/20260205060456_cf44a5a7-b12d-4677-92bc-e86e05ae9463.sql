-- Create storage bucket for KYC documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false);

-- Allow authenticated users to upload their own KYC documents
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own KYC documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create KYC verification table
CREATE TABLE public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  id_proof_url TEXT,
  id_proof_type TEXT,
  address_proof_url TEXT,
  address_proof_type TEXT,
  additional_certificates TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Providers can view their own KYC status
CREATE POLICY "Users can view their own KYC verification"
ON public.kyc_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Providers can insert their own KYC
CREATE POLICY "Users can insert their own KYC verification"
ON public.kyc_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Providers can update their own KYC (only if not approved)
CREATE POLICY "Users can update their own pending KYC verification"
ON public.kyc_verifications
FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- Create trigger for updated_at
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();