/*
  # Fix addresses insert policy conflict

  1. Változások
    - Törlésre kerül a "Users can manage own addresses" policy
    - Ez ütközött a vendég vásárlás funkcióval
  
  2. Biztonság
    - A meglévő "Anyone can insert addresses" és "Anonymous users can create addresses" policy-k
      kezelik a cím beszúrást authenticated és anon felhasználóknak is
*/

DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;