-- Fix provider signup flow
-- Update handle_new_user function to properly handle provider metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    user_id, 
    full_name, 
    email, 
    role, 
    is_provider,
    primary_skill,
    service_location,
    service_description,
    kyc_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer', -- Everyone starts as customer role
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false),
    NEW.raw_user_meta_data->>'primary_skill',
    NEW.raw_user_meta_data->>'service_location',
    NEW.raw_user_meta_data->>'service_description',
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false) = true 
      THEN 'pending' 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$$;
