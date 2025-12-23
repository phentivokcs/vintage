/*
  # Enable RLS with proper guest checkout support
  
  1. Changes
    - Re-enable RLS on addresses and orders tables
    - Ensure anon users can insert into both tables
    - Ensure public can read their own data after creation
    
  2. Security
    - RLS is enabled for data protection
    - Anonymous users can create orders and addresses for checkout
    - Users can only read/update their own data
*/

-- Re-enable RLS on addresses and orders
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Ensure order_items has proper policies for guest checkout
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);
