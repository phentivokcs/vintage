/*
  # Fix inventory table duplicate SELECT policies
  
  1. Changes
    - Remove duplicate "Anyone can view inventory" policy
    - Keep only "Anyone can read inventory" with role public
    
  2. Security
    - Maintains public read access to inventory
    - Removes redundant policy that may cause conflicts
*/

DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
