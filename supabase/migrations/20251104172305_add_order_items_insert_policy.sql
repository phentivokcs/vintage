/*
  # Add Order Items Insert Policy

  1. Changes
    - Add INSERT policy for order_items table
    
  2. Security
    - Users can only insert order items for their own orders
*/

-- Allow authenticated users to insert order items for their own orders
CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
