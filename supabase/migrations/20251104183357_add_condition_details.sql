/*
  # Add detailed condition information

  1. Changes
    - Add `condition_description` column to products table for detailed condition notes
    - Add `condition_images` JSONB column to store specific condition-related image references
  
  2. Notes
    - condition_description allows admins to add detailed notes about product condition
    - condition_images can store array of image URLs highlighting specific condition aspects
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'condition_description'
  ) THEN
    ALTER TABLE products ADD COLUMN condition_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'condition_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN condition_notes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;