/*
  # Fix addresses table policies for guest checkout
  
  1. Changes
    - Remove duplicate SELECT policies
    - Add public SELECT policy for guest users to read their addresses
    - Maintain authenticated user policies
    
  2. Security
    - Public users can create addresses
    - Both authenticated and anonymous can read addresses (for order confirmation)
    - Only authenticated users can update/delete their own addresses
*/

-- Remove duplicate policies
DROP POLICY IF EXISTS "Users can read own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;

-- Allow everyone to read addresses (needed for order confirmation page)
CREATE POLICY "Anyone can read addresses"
  ON addresses
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can still update and delete their own
-- (these policies already exist and work correctly)
