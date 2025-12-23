/*
  # Add shipping columns to orders table

  1. Changes
    - Add `shipping_provider` column to store the shipping provider name (dpd, packeta)
    - Add `shipping_label_url` column to store the generated shipping label URL
  
  2. Notes
    - Both columns are optional (nullable)
    - shipping_provider is text type for flexibility
    - shipping_label_url stores the full URL to the shipping label
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_provider'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_provider text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_label_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_label_url text;
  END IF;
END $$;
