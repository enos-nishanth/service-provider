-- =====================================================
-- CONSOLIDATE: Rename profiles to users, update all references
-- =====================================================

-- Step 1: Rename the profiles table to users
ALTER TABLE public.profiles RENAME TO users;

-- Step 2: Update the primary key constraint name
ALTER TABLE public.users RENAME CONSTRAINT profiles_pkey TO users_pkey;

-- Step 3: Rename phone column to mobile for consistency
ALTER TABLE public.users RENAME COLUMN phone TO mobile;

-- Step 4: Drop and recreate all RLS policies with updated table name
-- First, drop existing policies on users (formerly profiles)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Provider profiles are publicly viewable" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

-- Recreate policies with new names
CREATE POLICY "Users can view own record" 
ON public.users FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own record" 
ON public.users FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own record" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers are publicly viewable" 
ON public.users FOR SELECT 
USING (is_provider = true);

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all users" 
ON public.users FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Update the handle_new_user trigger function to use 'users' table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, full_name, email, role, is_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer',
    false
  );
  RETURN NEW;
END;
$$;

-- Step 6: Update update_provider_rating function to use 'users' table
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;