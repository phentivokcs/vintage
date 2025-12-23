/*
  # Add Orders Insert Policy

  1. Changes
    - Add INSERT policy for orders table so users can create their own orders
    
  2. Security
    - Users can only insert orders with their own user_id
*/

-- Allow authenticated users to insert their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
