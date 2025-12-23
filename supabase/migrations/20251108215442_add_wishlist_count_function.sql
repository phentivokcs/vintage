/*
  # Add wishlist count functionality

  1. New Functions
    - `get_product_wishlist_count(product_id)` - Returns the number of users who wishlisted a product
    - `get_trending_products(limit_count)` - Returns top products by wishlist count
  
  2. Changes
    - Make wishlist counts publicly visible for all users
    - Enable efficient querying of popular products
*/

-- Function to get wishlist count for a product
CREATE OR REPLACE FUNCTION get_product_wishlist_count(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO count_result
  FROM wishlists
  WHERE product_id = p_product_id;
  
  RETURN COALESCE(count_result, 0);
END;
$$;

-- Function to get trending products (most wishlisted)
CREATE OR REPLACE FUNCTION get_trending_products(limit_count integer DEFAULT 10)
RETURNS TABLE (
  product_id uuid,
  wishlist_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.product_id,
    COUNT(*)::bigint as wishlist_count
  FROM wishlists w
  INNER JOIN products p ON p.id = w.product_id
  WHERE p.status = 'active'
  GROUP BY w.product_id
  ORDER BY wishlist_count DESC
  LIMIT limit_count;
END;
$$;