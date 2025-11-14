/*
  # Add Orders Update Policy

  1. Changes
    - Add UPDATE policy for orders table so users can update their own orders
    
  2. Security
    - Users can only update their own orders
*/

-- Allow authenticated users to update their own orders
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
