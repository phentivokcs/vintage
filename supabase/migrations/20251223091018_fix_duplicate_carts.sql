/*
  # Fix Duplicate Carts Issue
  
  1. Problem
    - Multiple cart records exist for single users
    - Causes "JSON object requested, multiple rows returned" error
    
  2. Solution
    - Delete duplicate carts, keeping only the most recent one per user
    - Add unique constraint on user_id to prevent future duplicates
    
  3. Changes
    - Remove duplicate cart records
    - Add unique constraint on carts(user_id)
*/

-- Delete duplicate carts, keeping only the most recent one per user
DELETE FROM carts
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM carts
  WHERE user_id IS NOT NULL
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'carts_user_id_unique'
  ) THEN
    ALTER TABLE carts 
    ADD CONSTRAINT carts_user_id_unique UNIQUE (user_id);
  END IF;
END $$;