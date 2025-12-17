-- Migration: auth-trigger.sql
-- Description: Auto-create user profile on signup
-- Created: 2025-12-17

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_branch_id UUID;
BEGIN
  -- Get default branch (Lampung HQ)
  SELECT id INTO default_branch_id FROM branches WHERE code = 'LPG' LIMIT 1;

  -- Insert user profile
  INSERT INTO public.users (
    id,
    branch_id,
    role,
    full_name,
    phone,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    default_branch_id,
    'customer', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to sync user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users update (for last login tracking)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_update();
