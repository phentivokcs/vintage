/*
  # Add status and stock_quantity columns to variants table

  1. Changes
    - Add `status` column to `variants` table (draft, active, archived)
    - Add `stock_quantity` column to `variants` table
    - Set default values for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'status'
  ) THEN
    ALTER TABLE variants ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE variants ADD COLUMN stock_quantity integer DEFAULT 0;
  END IF;
END $$;
