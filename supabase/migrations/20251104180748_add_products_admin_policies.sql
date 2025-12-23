/*
  # Add admin policies for products table

  1. New Policies
    - Allow authenticated users to insert products
    - Allow authenticated users to update products
    - Allow authenticated users to delete products
  
  2. Security
    - All policies require authentication
    - In production, you may want to add role-based checks
*/

-- Allow authenticated users to insert products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);
