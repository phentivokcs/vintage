/*
  # Inventory Management Functions
  
  1. Functions
    - decrement_inventory - Csökkenti a készletet sikeres fizetés után
  
  2. Security
    - Csak service role használhatja
*/

CREATE OR REPLACE FUNCTION decrement_inventory(variant_id uuid, quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET 
    quantity_available = GREATEST(quantity_available - quantity, 0),
    updated_at = now()
  WHERE inventory.variant_id = decrement_inventory.variant_id;
END;
$$;