/*
  # Szinkronizáld inventory-t variants stock_quantity-vel
  
  1. Változtatások
    - Frissíti a decrement_inventory_on_order funkciót
    - Most már a variants.stock_quantity-t is csökkenti
    - Ez aktiválja a mark_product_as_sold triggert amikor készlet 0-ra megy
  
  2. Működés
    - Amikor order_item létrejön → inventory csökken ÉS variants.stock_quantity is
    - Ha variants.stock_quantity = 0 → mark_product_as_sold trigger aktiválódik
    - Termék és variant státusza 'sold'-ra vált
    - Termék eltűnik a shop-ból
*/

-- Update function to also decrement variants.stock_quantity
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory table
  UPDATE inventory
  SET quantity_available = quantity_available - NEW.quantity
  WHERE variant_id = NEW.variant_id
    AND quantity_available >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nincs elegendő készlet a termékből (variant_id: %)', NEW.variant_id;
  END IF;

  -- Also update variants.stock_quantity to trigger sold status
  UPDATE variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update cancel function to also restore variants.stock_quantity
CREATE OR REPLACE FUNCTION increment_inventory_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore inventory table
  UPDATE inventory
  SET quantity_available = quantity_available + OLD.quantity
  WHERE variant_id = OLD.variant_id;

  -- Also restore variants.stock_quantity
  UPDATE variants
  SET stock_quantity = stock_quantity + OLD.quantity
  WHERE id = OLD.variant_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;