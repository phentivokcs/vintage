/*
  # Bolt értékelési rendszer

  1. Változtatások
    - `product_reviews` tábla átnevezése `store_reviews`-ra
    - `product_id` mező eltávolítása
    - Új tábla: boltértékelések, csak vásárlói értékelésekhez
    
  2. Új táblák
    - `store_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key -> auth.users)
      - `order_id` (uuid, foreign key -> orders) - csak azok értékelhetnek, akik vásároltak
      - `rating` (integer, 1-5 csillag)
      - `title` (text, rövid összefoglaló)
      - `comment` (text, részletes vélemény)
      - `helpful_count` (integer, hányan találták hasznosnak)
      - `status` (text, 'pending' | 'approved' | 'rejected')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `store_review_helpful`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key -> store_reviews)
      - `user_id` (uuid, foreign key -> auth.users)
      - `created_at` (timestamptz)
      - Unique constraint (review_id, user_id)

  3. Biztonsági szabályok
    - Bárki olvashatja a jóváhagyott értékeléseket
    - Csak vásárlók írhatnak értékelést (akiknek van order_id-juk)
    - Felhasználók csak saját értékelésüket szerkeszthetik/törölhetik
    - Authenticated users (admins) mindent kezelhetnek
    - Egy user csak egyszer értékelheti a boltot
*/

-- Store reviews table
CREATE TABLE IF NOT EXISTS store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text,
  helpful_count integer DEFAULT 0,
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Store review helpful tracking
CREATE TABLE IF NOT EXISTS store_review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES store_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_reviews_user_id ON store_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_store_reviews_rating ON store_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_store_reviews_status ON store_reviews(status);
CREATE INDEX IF NOT EXISTS idx_store_review_helpful_review_id ON store_review_helpful(review_id);

-- Enable RLS
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_review_helpful ENABLE ROW LEVEL SECURITY;

-- Store Reviews Policies

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved store reviews"
  ON store_reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can view all reviews (for admin)
CREATE POLICY "Authenticated users can view all store reviews"
  ON store_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users who have orders can create reviews
CREATE POLICY "Customers can create store reviews"
  ON store_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'completed'
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own store reviews"
  ON store_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users (admins) can update all reviews
CREATE POLICY "Authenticated users can update all store reviews"
  ON store_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own store reviews"
  ON store_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users (admins) can delete all reviews
CREATE POLICY "Authenticated users can delete all store reviews"
  ON store_reviews FOR DELETE
  TO authenticated
  USING (true);

-- Store Review Helpful Policies

-- Anyone can see helpful counts
CREATE POLICY "Anyone can view store review helpful marks"
  ON store_review_helpful FOR SELECT
  USING (true);

-- Authenticated users can mark reviews as helpful
CREATE POLICY "Authenticated users can mark store reviews helpful"
  ON store_review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own helpful marks
CREATE POLICY "Users can remove own store review helpful marks"
  ON store_review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_store_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE store_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE store_reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
DROP TRIGGER IF EXISTS trigger_update_store_review_helpful_count ON store_review_helpful;
CREATE TRIGGER trigger_update_store_review_helpful_count
  AFTER INSERT OR DELETE ON store_review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_store_review_helpful_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_store_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_store_reviews_updated_at ON store_reviews;
CREATE TRIGGER trigger_update_store_reviews_updated_at
  BEFORE UPDATE ON store_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_store_reviews_updated_at();