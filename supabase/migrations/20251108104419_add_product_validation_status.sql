/*
  # Add Product Validation Status System

  1. New Columns
    - `validation_status` on products table - shows what's missing (needs_image, needs_size, needs_price, complete)
    
  2. New Function
    - `calculate_product_validation_status()` - automatically calculates if product has all required data
    - Checks for: images, variants with sizes, variants with prices
    
  3. Security
    - Maintains existing RLS policies
*/

-- Add validation_status column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE products ADD COLUMN validation_status text DEFAULT 'incomplete';
  END IF;
END $$;

-- Function to calculate product validation status
CREATE OR REPLACE FUNCTION calculate_product_validation_status(product_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  has_images boolean;
  has_variants boolean;
  has_valid_prices boolean;
  has_sizes boolean;
BEGIN
  -- Check if product has images
  SELECT EXISTS(
    SELECT 1 FROM product_images 
    WHERE product_id = product_id_param
  ) INTO has_images;
  
  -- Check if product has variants
  SELECT EXISTS(
    SELECT 1 FROM variants 
    WHERE product_id = product_id_param
  ) INTO has_variants;
  
  -- Check if variants have valid prices
  SELECT EXISTS(
    SELECT 1 FROM variants 
    WHERE product_id = product_id_param 
    AND price_gross > 0
  ) INTO has_valid_prices;
  
  -- Check if variants have size attributes
  SELECT EXISTS(
    SELECT 1 FROM variants 
    WHERE product_id = product_id_param 
    AND attributes->>'size' IS NOT NULL
    AND attributes->>'size' != ''
  ) INTO has_sizes;
  
  -- Return specific status based on what's missing
  IF NOT has_images THEN
    RETURN 'needs_image';
  ELSIF NOT has_variants OR NOT has_valid_prices THEN
    RETURN 'needs_price';
  ELSIF NOT has_sizes THEN
    RETURN 'needs_size';
  ELSE
    RETURN 'complete';
  END IF;
END;
$$;

-- Function to update validation status for a product
CREATE OR REPLACE FUNCTION update_product_validation_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the product's validation_status
  UPDATE products 
  SET validation_status = calculate_product_validation_status(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.product_id
      ELSE NEW.product_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.product_id
    ELSE NEW.product_id
  END;
  
  RETURN NEW;
END;
$$;

-- Triggers to automatically update validation status
DROP TRIGGER IF EXISTS update_validation_on_image_change ON product_images;
CREATE TRIGGER update_validation_on_image_change
  AFTER INSERT OR UPDATE OR DELETE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_product_validation_status();

DROP TRIGGER IF EXISTS update_validation_on_variant_change ON variants;
CREATE TRIGGER update_validation_on_variant_change
  AFTER INSERT OR UPDATE OR DELETE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_validation_status();

-- Update validation status for all existing products
UPDATE products 
SET validation_status = calculate_product_validation_status(id);