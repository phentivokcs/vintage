/*
  # Add Payments Insert Policy

  1. Changes
    - Add INSERT policy for payments table
    
  2. Security
    - Users can only insert payments for their own orders
*/

-- Allow authenticated users to insert payments for their own orders
CREATE POLICY "Users can create payments for own orders"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );
