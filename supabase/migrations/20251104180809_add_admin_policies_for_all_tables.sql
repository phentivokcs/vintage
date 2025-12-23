/*
  # Add admin policies for all product-related tables

  1. New Policies
    - Allow authenticated users to manage product_images
    - Allow authenticated users to manage variants
    - Allow authenticated users to manage inventory
    - Allow authenticated users to manage brands
    - Allow authenticated users to manage categories
  
  2. Security
    - All policies require authentication
    - Enables full CRUD operations for authenticated users
*/

-- Product Images policies
CREATE POLICY "Authenticated users can insert product images"
  ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product images"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product images"
  ON product_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Variants policies
CREATE POLICY "Authenticated users can insert variants"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variants"
  ON variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variants"
  ON variants
  FOR DELETE
  TO authenticated
  USING (true);

-- Inventory policies
CREATE POLICY "Authenticated users can insert inventory"
  ON inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
  ON inventory
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory"
  ON inventory
  FOR DELETE
  TO authenticated
  USING (true);

-- Brands policies
CREATE POLICY "Authenticated users can insert brands"
  ON brands
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update brands"
  ON brands
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brands"
  ON brands
  FOR DELETE
  TO authenticated
  USING (true);

-- Categories policies
CREATE POLICY "Authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);
