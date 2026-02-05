-- Update handle_new_user function to use unified user model
-- All new users start as customers with is_provider = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role, is_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer', -- Everyone starts as a customer
    false -- is_provider defaults to false
  );
  RETURN NEW;
END;
$$;