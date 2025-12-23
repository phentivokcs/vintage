/*
  # Allow Anonymous Users to View All Products

  1. Changes
    - Add policy for anonymous users to view all products
    - This enables the admin panel to work without authentication
    
  2. Security Note
    - This allows anyone to view all products including unpublished ones
    - Consider implementing proper authentication for admin panel in production
*/

-- Allow anonymous users to view all products
CREATE POLICY "Anonymous users can view all products"
  ON products
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view all variants
CREATE POLICY "Anonymous users can view all variants"
  ON variants
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view all product images
CREATE POLICY "Anonymous users can view all product images"
  ON product_images
  FOR SELECT
  TO anon
  USING (true);