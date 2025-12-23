/*
  # Add order_number and full_name to orders table
  
  1. Changes
    - Add `order_number` column for human-readable order tracking
    - Add `full_name` column for customer name on the order
    - Make order_number unique and indexed for fast lookups
  
  2. Notes
    - order_number format: ORD-{timestamp}-{random}
    - full_name will be used in emails and invoices
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN full_name text;
  END IF;
END $$;