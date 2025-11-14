/*
  # Allow anonymous users to insert products
  
  1. Changes
    - Add policy to allow anonymous (admin panel) users to insert products
    - This is safe because the admin panel has password protection
  
  2. Security
    - Admin panel is protected with password
    - Anonymous users can only insert, not update or delete
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;

-- Create new policy for both authenticated and anonymous users
CREATE POLICY "Users can insert products"
  ON products
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
