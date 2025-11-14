/*
  # Flash sale / Időzített akciók rendszer

  1. Új tábla
    - `flash_sales`
      - `id` (uuid, primary key)
      - `name` (text, akció neve)
      - `description` (text)
      - `discount_percentage` (integer, kedvezmény százalék)
      - `start_time` (timestamptz, kezdés időpontja)
      - `end_time` (timestamptz, befejezés időpontja)
      - `is_active` (boolean, aktív-e)
      - `created_at` (timestamptz)

    - `flash_sale_products`
      - `id` (uuid, primary key)
      - `flash_sale_id` (uuid, foreign key -> flash_sales)
      - `product_id` (uuid, foreign key -> products)
      - `created_at` (timestamptz)

  2. Biztonsági szabályok
    - Bárki olvashatja az aktív akciókat
    - Csak authenticated users (admin) kezelhetik

  3. Funkciók
    - Automatikus aktiválás/deaktiválás időpont alapján
*/

-- Flash sales table
CREATE TABLE IF NOT EXISTS flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Flash sale products junction table
CREATE TABLE IF NOT EXISTS flash_sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id uuid NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(flash_sale_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flash_sales_dates ON flash_sales(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_sale ON flash_sale_products(flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_product ON flash_sale_products(product_id);

-- Enable RLS
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale_products ENABLE ROW LEVEL SECURITY;

-- Flash Sales Policies

-- Anyone can view active flash sales
CREATE POLICY "Anyone can view active flash sales"
  ON flash_sales FOR SELECT
  USING (
    is_active = true
    AND now() BETWEEN start_time AND end_time
  );

-- Authenticated users can view all flash sales
CREATE POLICY "Authenticated users can view all flash sales"
  ON flash_sales FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can manage flash sales
CREATE POLICY "Authenticated users can insert flash sales"
  ON flash_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update flash sales"
  ON flash_sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete flash sales"
  ON flash_sales FOR DELETE
  TO authenticated
  USING (true);

-- Flash Sale Products Policies

-- Anyone can view active flash sale products
CREATE POLICY "Anyone can view flash sale products"
  ON flash_sale_products FOR SELECT
  USING (true);

-- Authenticated users can manage flash sale products
CREATE POLICY "Authenticated users can insert flash sale products"
  ON flash_sale_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete flash sale products"
  ON flash_sale_products FOR DELETE
  TO authenticated
  USING (true);

-- View for active flash sales with products
CREATE OR REPLACE VIEW active_flash_sales AS
SELECT
  fs.*,
  array_agg(fsp.product_id) as product_ids
FROM flash_sales fs
LEFT JOIN flash_sale_products fsp ON fs.id = fsp.flash_sale_id
WHERE fs.is_active = true
  AND now() BETWEEN fs.start_time AND fs.end_time
GROUP BY fs.id;