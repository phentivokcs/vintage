/*
  # Fix auto-create inventory trigger - use correct column name
  
  1. Changes
    - Updates the trigger to use 'quantity_available' instead of 'qty_available'
*/

CREATE OR REPLACE FUNCTION create_inventory_for_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO inventory (variant_id, quantity_available, location)
  VALUES (NEW.id, COALESCE(NEW.stock_quantity, 0), 'main');
  
  RETURN NEW;
END;
$$;