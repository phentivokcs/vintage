/*
  # Add hidden flag to categories table

  1. Changes
    - Add `hidden` boolean column to categories table (default: false)
    - Categories with hidden=true won't appear in navigation menus
    - Hidden categories can still be accessed via direct links
  
  2. Purpose
    - Allows creating special categories (e.g., "Winter Collection") that are only accessible via specific links
    - Useful for seasonal collections, special promotions, or curated selections
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'hidden'
  ) THEN
    ALTER TABLE categories ADD COLUMN hidden boolean DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN categories.hidden IS 'Hidden categories do not appear in navigation menus but are accessible via direct links';