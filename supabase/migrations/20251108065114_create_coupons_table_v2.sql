/*
  # Create Coupons System

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The coupon code (e.g., THANK10-ABC123)
      - `discount_type` (text) - 'percentage' or 'fixed_amount'
      - `discount_value` (numeric) - The discount amount (10 for 10%, or 1000 for 1000 HUF)
      - `min_order_value` (numeric, nullable) - Minimum order value to use coupon
      - `max_discount` (numeric, nullable) - Maximum discount cap for percentage coupons
      - `usage_limit` (integer, nullable) - How many times the coupon can be used total
      - `usage_count` (integer) - How many times it has been used
      - `per_user_limit` (integer, nullable) - How many times one user can use it
      - `valid_from` (timestamptz) - When the coupon becomes valid
      - `valid_until` (timestamptz, nullable) - When the coupon expires
      - `is_active` (boolean) - Whether the coupon is currently active
      - `created_at` (timestamptz)
      - `created_by` (uuid, nullable) - User who created it

    - `coupon_usage`
      - `id` (uuid, primary key)
      - `coupon_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key)
      - `discount_amount` (numeric) - Actual discount applied
      - `used_at` (timestamptz)

  2. Changes to existing tables
    - Add `coupon_id` and `discount_amount` to `orders` table

  3. Security
    - Enable RLS on both tables
    - All authenticated users can view active coupons and validate them
    - Users can view their own coupon usage
    - Usage tracking is automatic via order system
*/

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_value numeric DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create coupon usage tracking table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- Add coupon fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_id uuid REFERENCES coupons(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Coupons policies - All authenticated users can view active valid coupons
CREATE POLICY "Users can view active valid coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "System can insert coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (true);

-- Coupon usage policies
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for faster coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);