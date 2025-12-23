/*
  # Comprehensive fix for guest checkout policies
  
  1. Changes
    - Drop all conflicting/duplicate policies for checkout-related tables
    - Create simple, clear policies for guest checkout support
    - Allow public INSERT and SELECT for orders, order_items, payments
    - Maintain UPDATE policies for authenticated users only
    
  2. Security
    - Public users can create and read orders (needed for guest checkout)
    - Public users can create and read order items
    - Public users can create and read payments
    - Only authenticated users can update/delete their own data
    - Addresses already fixed in previous migration
*/

-- ====================================
-- ORDERS TABLE
-- ====================================

-- Drop all existing orders policies
DROP POLICY IF EXISTS "Anonymous users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Create new simplified policies
CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ====================================
-- ORDER_ITEMS TABLE
-- ====================================

-- Drop all existing order_items policies
DROP POLICY IF EXISTS "Anonymous users can create order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;

-- Create new simplified policies
CREATE POLICY "Anyone can insert order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

-- ====================================
-- PAYMENTS TABLE
-- ====================================

-- Drop all existing payments policies
DROP POLICY IF EXISTS "Anonymous users can create payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments for own orders" ON payments;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;

-- Create new simplified policies
CREATE POLICY "Anyone can insert payments"
  ON payments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read payments"
  ON payments
  FOR SELECT
  TO public
  USING (true);
