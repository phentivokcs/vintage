/*
  # Fix Users Table Constraints

  1. Changes
    - Make password_hash nullable (stored in auth.users instead)
    - Add trigger to sync auth.users with public.users
    - Insert existing auth users into public.users
*/

-- Make password_hash nullable since we use auth.users for authentication
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, new.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert existing auth users into public.users
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
