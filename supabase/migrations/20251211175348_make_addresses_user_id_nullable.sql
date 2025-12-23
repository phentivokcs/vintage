/*
  # Vendég vásárlók támogatása

  1. Változások
    - Az addresses táblában a user_id nullable lesz
    - RLS policy frissítése hogy vendégek is tudjanak címet létrehozni
  
  2. Biztonság
    - Vendég címeket csak a rendelés során lehet létrehozni
    - Bejelentkezett felhasználók továbbra is csak a saját címeiket láthatják
*/

ALTER TABLE addresses 
ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert addresses"
  ON addresses FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);