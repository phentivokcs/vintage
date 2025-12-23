/*
  # Vendég vásárlók kupon használata

  1. Változások
    - A coupon_usage táblában a user_id nullable lesz
  
  2. Biztonság
    - Vendégek is használhatnak kuponokat
*/

ALTER TABLE coupon_usage 
ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can insert coupon usage" ON coupon_usage;

CREATE POLICY "Anyone can insert coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);