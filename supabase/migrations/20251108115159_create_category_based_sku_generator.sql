/*
  # Kategória alapú SKU generálás
  
  1. Funkció
    - `generate_sku_for_category(category_slug)` - Kategória alapján generál SKU-t
    - Pólók: T001, T002, T003...
    - Pulcsik: H001, H002, H003...
    - Nadrágok: N001, N002, N003...
    - Kabátok: K001, K002, K003...
    - Sapkák: S001, S002, S003...
    - Cipők: C001, C002, C003...
    - Kiegészítők: KE001, KE002, KE003...
  
  2. Működés
    - Megkeresi az adott kategóriában a legmagasabb számot
    - Visszaadja a következő szabad SKU-t
    - Mindig 3 számjegyű (001, 002, 010, 100)
*/

CREATE OR REPLACE FUNCTION generate_sku_for_category(cat_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  max_number INTEGER;
  next_number INTEGER;
  new_sku TEXT;
BEGIN
  -- Determine prefix based on category slug
  prefix := CASE cat_slug
    WHEN 'polok' THEN 'T'
    WHEN 'felsok' THEN 'T'
    WHEN 'pulcsik' THEN 'H'
    WHEN 'puloverek' THEN 'H'
    WHEN 'nadragok' THEN 'N'
    WHEN 'kabatok' THEN 'K'
    WHEN 'dzsekik' THEN 'K'
    WHEN 'sapkak' THEN 'S'
    WHEN 'cipok' THEN 'C'
    WHEN 'kiegeszitok' THEN 'KE'
    ELSE 'P' -- Default: Product
  END;
  
  -- Find the highest number for this prefix
  SELECT COALESCE(
    MAX(
      CAST(
        REGEXP_REPLACE(v.sku, '^[A-Z]+', '') AS INTEGER
      )
    ),
    0
  )
  INTO max_number
  FROM variants v
  JOIN products p ON p.id = v.product_id
  JOIN categories c ON c.id = p.category_id
  WHERE v.sku ~ ('^' || prefix || '[0-9]+$')
    AND c.slug = cat_slug;
  
  -- Calculate next number
  next_number := max_number + 1;
  
  -- Format SKU with leading zeros (3 digits)
  new_sku := prefix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_sku;
END;
$$ LANGUAGE plpgsql;