-- Add admin policies to allow admins to view and update all profiles and KYC verifications
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all KYC verifications
CREATE POLICY "Admins can view all KYC verifications"
ON public.kyc_verifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update KYC verifications (approve/reject)
CREATE POLICY "Admins can update all KYC verifications"
ON public.kyc_verifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));