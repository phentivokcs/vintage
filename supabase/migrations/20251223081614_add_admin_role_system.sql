/*
  # Admin Role System with Supabase Auth

  ## Summary
  Implements a secure admin role system using Supabase Auth's built-in
  raw_app_meta_data field instead of hardcoded passwords.

  ## Changes Made

  ### 1. Admin Role Storage
  - Uses `auth.users.raw_app_meta_data` to store admin role
  - This field CANNOT be modified by users (only by service role)
  - Accessible via `auth.jwt()` function in RLS policies

  ### 2. Helper Function
  - `is_admin()` function to check if current user is admin
  - Returns true if user has `role: 'admin'` in app_metadata
  - Used in RLS policies for admin-only operations

  ### 3. Updated RLS Policies
  - Products: Admins can insert/update/delete all products
  - Product Images: Admins can manage all images
  - Variants: Admins can manage all variants
  - Inventory: Admins can manage all inventory
  - Orders: Admins can view/update all orders
  - Other tables: Admin full access where needed

  ## Security Notes
  - Admin role is set via service role only (not exposed to client)
  - Users cannot grant themselves admin access
  - JWT contains admin status for fast policy checks
  - No hardcoded passwords in code

  ## Usage
  To create an admin user, run this via service role:
  
  ```sql
  UPDATE auth.users 
  SET raw_app_meta_data = 
    raw_app_meta_data || '{"role": "admin"}'::jsonb
  WHERE email = 'admin@example.com';
  ```
*/

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products: Admin policies
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update all products" ON products;
CREATE POLICY "Admins can update all products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

-- Product Images: Admin policies
DROP POLICY IF EXISTS "Admins can insert product images" ON product_images;
CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON product_images;
CREATE POLICY "Admins can update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON product_images;
CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (is_admin());

-- Variants: Admin policies
DROP POLICY IF EXISTS "Admins can insert variants" ON variants;
CREATE POLICY "Admins can insert variants"
  ON variants FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update variants" ON variants;
CREATE POLICY "Admins can update variants"
  ON variants FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete variants" ON variants;
CREATE POLICY "Admins can delete variants"
  ON variants FOR DELETE
  TO authenticated
  USING (is_admin());

-- Inventory: Admin policies
DROP POLICY IF EXISTS "Admins can update inventory" ON inventory;
CREATE POLICY "Admins can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can insert inventory" ON inventory;
CREATE POLICY "Admins can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Orders: Admin can view and update all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;  
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Brands: Admin policies
DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
CREATE POLICY "Admins can manage brands"
  ON brands FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Categories: Admin policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Contact Messages: Admin can view all
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Coupons: Admin full access
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Flash Sales: Admin full access
DROP POLICY IF EXISTS "Admins can manage flash sales" ON flash_sales;
CREATE POLICY "Admins can manage flash sales"
  ON flash_sales FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage flash sale products" ON flash_sale_products;
CREATE POLICY "Admins can manage flash sale products"
  ON flash_sale_products FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Discounts: Admin full access
DROP POLICY IF EXISTS "Admins can manage discounts" ON discounts;
CREATE POLICY "Admins can manage discounts"
  ON discounts FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Store Reviews: Admin can manage all
DROP POLICY IF EXISTS "Admins can manage store reviews" ON store_reviews;
CREATE POLICY "Admins can manage store reviews"
  ON store_reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Product Reviews: Admin can manage all
DROP POLICY IF EXISTS "Admins can manage product reviews" ON product_reviews;
CREATE POLICY "Admins can manage product reviews"
  ON product_reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Site Content: Admin full access
DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;
CREATE POLICY "Admins can manage site content"
  ON site_content FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());