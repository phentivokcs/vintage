/*
  # Fix Store Reviews Insert Policy

  1. Changes
    - Drop old restrictive INSERT policy
    - Create new policy that allows reviews for paid, completed, or shipped orders
  
  2. Security
    - Users can only review orders they own
    - Orders must be in paid, completed, or shipped status
*/

DROP POLICY IF EXISTS "Customers can create store reviews" ON store_reviews;

CREATE POLICY "Customers can create store reviews"
  ON store_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 
      FROM orders 
      WHERE orders.id = store_reviews.order_id 
        AND orders.user_id = auth.uid() 
        AND orders.status IN ('paid', 'completed', 'shipped')
    )
  );
