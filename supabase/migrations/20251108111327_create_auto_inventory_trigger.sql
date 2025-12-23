/*
  # Auto-create inventory for new variants
  
  1. Changes
    - Creates a trigger function that automatically creates an inventory record when a new variant is created
    - The inventory record will use the variant's stock_quantity as the initial qty_available
  
  2. Notes
    - This ensures that every variant has a corresponding inventory record
    - Fixes the issue where products show as "out of stock" even when stock_quantity > 0
*/

CREATE OR REPLACE FUNCTION create_inventory_for_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO inventory (variant_id, qty_available, location)
  VALUES (NEW.id, COALESCE(NEW.stock_quantity, 0), 'main');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_inventory ON variants;

CREATE TRIGGER trigger_create_inventory
  AFTER INSERT ON variants
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_for_variant();