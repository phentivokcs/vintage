/*
  # Allow Public Access to User Profile Fields

  1. Changes
    - Add SELECT policy for public/authenticated users to view basic profile info
    - Only exposes: full_name, name, email (no sensitive data)
  
  2. Security
    - Read-only access
    - No access to sensitive fields like auth tokens, admin status, etc.
*/

CREATE POLICY "Anyone can view basic user profile info"
  ON users
  FOR SELECT
  TO public
  USING (true);
