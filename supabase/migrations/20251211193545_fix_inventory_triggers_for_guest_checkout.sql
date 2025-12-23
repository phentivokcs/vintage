/*
  # Fix inventory triggers for guest checkout
  
  1. Changes
    - Recreate all inventory-related functions with SECURITY DEFINER
    - This allows the functions to bypass RLS and update inventory/variants
    - Needed for guest checkout to properly decrement inventory
    
  2. Security
    - Functions run with elevated privileges but only perform specific operations
    - No user input is used in queries (only trigger data)
    - This is safe and standard practice for trigger functions
*/

-- Recreate decrement_inventory_on_order with SECURITY DEFINER
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Recreate increment_inventory_on_cancel with SECURITY DEFINER
CREATE OR REPLACE FUNCTION increment_inventory_on_cancel()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update inventory table
  UPDATE inventory
  SET quantity_available = quantity_available + OLD.quantity
  WHERE variant_id = OLD.variant_id;

  -- Also update variants.stock_quantity
  UPDATE variants
  SET stock_quantity = stock_quantity + OLD.quantity
  WHERE id = OLD.variant_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate handle_order_cancellation with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_order_cancellation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If order is being cancelled, restore inventory for all items
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Update inventory and variants for each item
    UPDATE inventory i
    SET quantity_available = quantity_available + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND i.variant_id = oi.variant_id;

    UPDATE variants v
    SET stock_quantity = stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND v.id = oi.variant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate create_inventory_for_variant with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_inventory_for_variant()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO inventory (variant_id, quantity_available)
  VALUES (NEW.id, NEW.stock_quantity)
  ON CONFLICT (variant_id) DO UPDATE
  SET quantity_available = NEW.stock_quantity;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate mark_product_as_sold with SECURITY DEFINER
CREATE OR REPLACE FUNCTION mark_product_as_sold()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If stock is being reduced to 0 or below, mark variant as sold
  IF NEW.stock_quantity <= 0 AND OLD.stock_quantity > 0 THEN
    NEW.status = 'sold';
  -- If stock is being increased from 0, mark as available
  ELSIF NEW.stock_quantity > 0 AND OLD.stock_quantity <= 0 THEN
    NEW.status = 'available';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
