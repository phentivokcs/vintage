/*
  # Add product discount system

  1. Changes to `variants` table
    - Add `discount_price_gross` column to store the discounted price
    - Add `discount_start_date` column to track when discount starts
    - Add `discount_end_date` column to track when discount ends
    - Discount is active only when current date is between start and end dates
  
  2. Features
    - Allows setting temporary discounts on product variants
    - Automatically shows original price vs discounted price
    - Time-based discount activation/deactivation
    - NULL discount_price means no discount active
*/

-- Add discount columns to variants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'discount_price_gross'
  ) THEN
    ALTER TABLE variants ADD COLUMN discount_price_gross numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'discount_start_date'
  ) THEN
    ALTER TABLE variants ADD COLUMN discount_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'discount_end_date'
  ) THEN
    ALTER TABLE variants ADD COLUMN discount_end_date timestamptz;
  END IF;
END $$;

-- Add constraint to ensure discount price is less than regular price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'variants_discount_price_check'
  ) THEN
    ALTER TABLE variants ADD CONSTRAINT variants_discount_price_check 
      CHECK (discount_price_gross IS NULL OR discount_price_gross < price_gross);
  END IF;
END $$;

-- Create function to check if discount is currently active
CREATE OR REPLACE FUNCTION is_discount_active(
  p_discount_start_date timestamptz,
  p_discount_end_date timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_discount_start_date IS NULL OR p_discount_end_date IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN NOW() >= p_discount_start_date AND NOW() <= p_discount_end_date;
END;
$$;