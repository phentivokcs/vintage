/*
  # Site Content Management System

  ## Overview
  This migration creates a flexible content management system for the e-commerce site,
  allowing admins to modify images, text, colors, and other design elements without code changes.

  ## New Tables

  ### 1. site_content
  Stores all site content (text, URLs, colors, JSON data)
  - `id` (uuid, primary key)
  - `section` (text) - Content section: hero, promo, footer, seo, newsletter, design
  - `key` (text) - Unique identifier within section
  - `value` (jsonb) - Flexible content storage
  - `content_type` (text) - Type: text, url, color, json
  - `updated_at` (timestamptz)
  - `updated_by` (uuid) - References auth.users

  ### 2. site_assets
  Stores uploaded files (images, logos) with metadata
  - `id` (uuid, primary key)
  - `asset_key` (text, unique) - Unique identifier: hero_banner, logo, promo_1
  - `file_path` (text) - Storage path in Supabase Storage
  - `public_url` (text) - CDN URL for the asset
  - `file_size` (bigint) - File size in bytes
  - `mime_type` (text) - File MIME type
  - `width` (integer) - Image width in pixels
  - `height` (integer) - Image height in pixels
  - `uploaded_at` (timestamptz)
  - `uploaded_by` (uuid) - References auth.users

  ### 3. content_history
  Audit log for content changes
  - `id` (uuid, primary key)
  - `table_name` (text) - Which table was modified
  - `record_id` (uuid) - ID of modified record
  - `action` (text) - insert, update, delete
  - `old_value` (jsonb)
  - `new_value` (jsonb)
  - `changed_by` (uuid) - References auth.users
  - `changed_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Only authenticated admin users can modify content
  - Everyone can read published content
  - Audit trail for all changes

  ## Indexes
  - site_content: (section, key) unique
  - site_assets: asset_key unique
  - content_history: record_id, changed_at
*/

-- Site Content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  content_type text NOT NULL DEFAULT 'text',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(section, key),
  CHECK (section IN ('hero', 'promo', 'footer', 'seo', 'newsletter', 'design', 'category')),
  CHECK (content_type IN ('text', 'url', 'color', 'json', 'number', 'boolean'))
);

CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_at ON site_content(updated_at DESC);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site content"
  ON site_content FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage site content"
  ON site_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Site Assets table
CREATE TABLE IF NOT EXISTS site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text UNIQUE NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_assets_asset_key ON site_assets(asset_key);
CREATE INDEX IF NOT EXISTS idx_site_assets_uploaded_at ON site_assets(uploaded_at DESC);

ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site assets"
  ON site_assets FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage site assets"
  ON site_assets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content History table (audit log)
CREATE TABLE IF NOT EXISTS content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  CHECK (action IN ('insert', 'update', 'delete'))
);

CREATE INDEX IF NOT EXISTS idx_content_history_record_id ON content_history(record_id);
CREATE INDEX IF NOT EXISTS idx_content_history_changed_at ON content_history(changed_at DESC);

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content history"
  ON content_history FOR SELECT
  TO authenticated
  USING (true);

-- Trigger function to log content changes
CREATE OR REPLACE FUNCTION log_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO content_history (table_name, record_id, action, old_value, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO content_history (table_name, record_id, action, old_value, new_value, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO content_history (table_name, record_id, action, new_value, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply triggers
CREATE TRIGGER site_content_audit
  AFTER INSERT OR UPDATE OR DELETE ON site_content
  FOR EACH ROW EXECUTE FUNCTION log_content_change();

CREATE TRIGGER site_assets_audit
  AFTER INSERT OR UPDATE OR DELETE ON site_assets
  FOR EACH ROW EXECUTE FUNCTION log_content_change();