/*
  # Használt ruha webshop - Core Schema
  
  ## Új táblák
  
  ### Felhasználók és címek
    - users - Vásárlói fiókok (email, név, telefon, GDPR)
    - addresses - Számlázási/szállítási címek (magyar formátum)
  
  ### Termékek
    - brands - Márkák
    - categories - Kategóriák (hierarchikus)
    - attributes - Attribútumok (méret, szín, állapot)
    - attribute_values - Attribútum értékek
    - products - Fő terméktábla
    - product_images - Termékképek
    - variants - SKU/készlet variánsok
    - inventory - Készletkezelés
  
  ### Kosár és rendelések
    - carts - Kosarak
    - cart_items - Kosár tételek
    - orders - Rendelések
    - order_items - Rendelési tételek
    - payments - Fizetések (Barion)
    - shipments - Szállítások
  
  ### Kampányok
    - discounts - Kuponok
  
  ## Biztonság
    - RLS minden táblán
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brands"
  ON brands FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS attributes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  type text DEFAULT 'select',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attributes"
  ON attributes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS attribute_values (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id uuid REFERENCES attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  sort_order int DEFAULT 0,
  UNIQUE(attribute_id, value)
);

ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attribute values"
  ON attribute_values FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  condition text,
  sex text,
  season text,
  original_price numeric(10,2),
  published boolean DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin(title gin_trgm_ops);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (published = true);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  width int,
  height int,
  sort_order int DEFAULT 0,
  is_cover boolean DEFAULT false,
  bg_removed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  barcode text,
  price_gross numeric(10,2) NOT NULL,
  price_net numeric(10,2) NOT NULL,
  vat_rate numeric(5,2) DEFAULT 27.00,
  currency text DEFAULT 'HUF',
  weight_g int,
  attributes jsonb DEFAULT '{}',
  unique_piece boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON variants(sku);

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants"
  ON variants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE,
  qty_available int DEFAULT 1,
  location text DEFAULT 'main',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(variant_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  type text NOT NULL,
  value numeric(10,2) NOT NULL,
  min_basket numeric(10,2) DEFAULT 0,
  active_from timestamptz,
  active_to timestamptz,
  usage_limit int,
  used_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts"
  ON discounts FOR SELECT
  TO authenticated, anon
  USING (
    (active_from IS NULL OR active_from <= now())
    AND (active_to IS NULL OR active_to >= now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  );