/*
  # Add 'sold' status for products
  
  1. Changes
    - Update products.status constraint to include 'sold'
    - Update variants.status constraint to include 'sold'
    - Create trigger to automatically mark products as sold when ordered
  
  2. Notes
    - Sold products will be hidden from public shop pages
    - Sold products remain visible in admin panel
    - Status changes from 'active' to 'sold' when inventory reaches 0 after purchase
*/

-- Update products status constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('active', 'draft', 'archived', 'sold'));

-- Update variants status constraint  
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_status_check;
ALTER TABLE variants ADD CONSTRAINT variants_status_check 
  CHECK (status IN ('active', 'inactive', 'out_of_stock', 'sold'));

-- Create function to mark product as sold when stock reaches 0
CREATE OR REPLACE FUNCTION mark_product_as_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- If stock quantity is 0 or less, mark variant as sold
  IF NEW.stock_quantity <= 0 THEN
    NEW.status = 'sold';
    
    -- Also mark the product as sold
    UPDATE products 
    SET status = 'sold' 
    WHERE id = NEW.product_id 
    AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on variants table
DROP TRIGGER IF EXISTS trigger_mark_product_sold ON variants;
CREATE TRIGGER trigger_mark_product_sold
  BEFORE UPDATE OF stock_quantity ON variants
  FOR EACH ROW
  EXECUTE FUNCTION mark_product_as_sold();