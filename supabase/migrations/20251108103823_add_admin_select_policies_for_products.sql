/*
  # Admin SELECT Policies for Products and Related Tables

  1. Changes
    - Add policy for authenticated users to view all products (not just published)
    - Add policy for authenticated users to view all variants
    - Add policy for authenticated users to view all product images
    
  2. Security
    - Maintains existing public policies for published products
    - Adds authenticated user access to all products for admin functionality
*/

-- Allow authenticated users to view all products (including unpublished)
CREATE POLICY "Authenticated users can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view all variants
CREATE POLICY "Authenticated users can view all variants"
  ON variants
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view all product images
CREATE POLICY "Authenticated users can view all product images"
  ON product_images
  FOR SELECT
  TO authenticated
  USING (true);