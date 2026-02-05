-- Migration: Unified User Model
-- Every user is a customer by default. Provider capability is an opt-in flag.
-- Admin status is managed via user_roles table (already exists).

-- Step 1: Add is_provider flag to profiles (provider capability, not separate role)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_provider BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Migrate existing providers - set is_provider = true for users with role = 'provider'
UPDATE public.profiles 
SET is_provider = true 
WHERE role = 'provider';

-- Step 3: Drop the role column constraint dependency first, then modify
-- We keep the role column but only use 'customer' and 'admin' values going forward
-- Existing 'provider' roles become 'customer' with is_provider = true
UPDATE public.profiles 
SET role = 'customer' 
WHERE role = 'provider';

-- Step 4: Update RLS policies to use behavioral model
-- Drop old provider-specific SELECT policy and create new one based on is_provider flag
DROP POLICY IF EXISTS "Provider profiles are publicly viewable" ON public.profiles;

CREATE POLICY "Provider profiles are publicly viewable" 
ON public.profiles 
FOR SELECT 
USING (is_provider = true);

-- Step 5: Update bookings policies to allow providers (who are also customers) to create bookings
-- First, let's check existing policies and update for unified model
DROP POLICY IF EXISTS "Customers can create their own bookings" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Step 6: Add index for faster provider lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_provider ON public.profiles(is_provider) WHERE is_provider = true;

-- Step 7: Add index for KYC status on providers
CREATE INDEX IF NOT EXISTS idx_profiles_provider_kyc ON public.profiles(kyc_status) WHERE is_provider = true;