/*
  # Add status column to products table

  1. Changes
    - Add `status` column to `products` table with default value 'draft'
    - Status can be: draft, active, archived
    - Ensures existing products have a valid status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE products ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived'));
  END IF;
END $$;
