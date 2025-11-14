/*
  # Fix inventory table column name consistency
  
  1. Changes
    - Renames qty_available to quantity_available for consistency
    - This is a no-op if the column is already named quantity_available
  
  2. Notes
    - Ensures migrations match the actual database schema
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory' AND column_name = 'qty_available'
  ) THEN
    ALTER TABLE inventory RENAME COLUMN qty_available TO quantity_available;
  END IF;
END $$;