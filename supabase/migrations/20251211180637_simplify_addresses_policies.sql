/*
  # Egyszerűsítés az addresses policy-kon

  1. Változások
    - Törlésre kerülnek az összes létező INSERT policy-k
    - Létrehozásra kerül egy egyszerű, univerzális INSERT policy
  
  2. Biztonság
    - Bárki (authenticated és anon) beszúrhat címeket
*/

-- Töröljük az összes meglévő INSERT policy-t
DROP POLICY IF EXISTS "Anonymous users can create addresses" ON addresses;
DROP POLICY IF EXISTS "Anyone can insert addresses" ON addresses;

-- Hozzunk létre egy egyszerű, univerzális policy-t
CREATE POLICY "Allow all to insert addresses"
  ON addresses
  FOR INSERT
  WITH CHECK (true);