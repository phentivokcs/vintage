/*
  # Automatikus raktár kezelés

  1. Funkciók
    - `decrement_inventory_on_order()` - Csökkenti a készletet rendeléskor
    - `increment_inventory_on_cancel()` - Visszaállítja a készletet törölt rendelésnél

  2. Triggerek
    - Rendelés létrehozásakor automatikusan csökkenti a készletet
    - Rendelés törlésekor automatikusan visszaállítja a készletet

  3. Biztonsági szabályok
    - Ellenőrzi, hogy van-e elegendő készlet
    - Hibát dob, ha nincs elég készlet
*/

-- Function to decrement inventory when order items are created
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory
  SET quantity_available = quantity_available - NEW.quantity
  WHERE variant_id = NEW.variant_id
    AND quantity_available >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nincs elegendő készlet a termékből (variant_id: %)', NEW.variant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment inventory when order items are deleted/cancelled
CREATE OR REPLACE FUNCTION increment_inventory_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory
  SET quantity_available = quantity_available + OLD.quantity
  WHERE variant_id = OLD.variant_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement inventory on order item insert
DROP TRIGGER IF EXISTS trigger_decrement_inventory ON order_items;
CREATE TRIGGER trigger_decrement_inventory
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_inventory_on_order();

-- Trigger to increment inventory on order item delete
DROP TRIGGER IF EXISTS trigger_increment_inventory ON order_items;
CREATE TRIGGER trigger_increment_inventory
  AFTER DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_inventory_on_cancel();

-- Function to check if order should restore inventory when cancelled
CREATE OR REPLACE FUNCTION handle_order_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE inventory
    SET quantity_available = quantity_available + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND inventory.variant_id = oi.variant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to restore inventory when order is cancelled
DROP TRIGGER IF EXISTS trigger_handle_order_cancellation ON orders;
CREATE TRIGGER trigger_handle_order_cancellation
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_order_cancellation();