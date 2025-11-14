/*
  # Fix Cart SELECT Policies

  1. Changes
    - Drop overly permissive SELECT policies
    - Add proper SELECT policies that check ownership

  2. Security
    - Users can only view their own cart and cart items
*/

DROP POLICY IF EXISTS "Users can access own cart" ON carts;
DROP POLICY IF EXISTS "Anyone can read cart items" ON cart_items;

CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );
