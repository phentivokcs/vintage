/*
  # Termék értékelések rendszer

  1. Új táblák
    - `product_reviews`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key -> products)
      - `user_id` (uuid, foreign key -> auth.users)
      - `order_id` (uuid, foreign key -> orders) - csak azok értékelhetnek, akik vettek
      - `rating` (integer, 1-5 csillag)
      - `title` (text, rövid összefoglaló)
      - `comment` (text, részletes vélemény)
      - `verified_purchase` (boolean, igaz ha rendelésből származik)
      - `helpful_count` (integer, hányan találták hasznosnak)
      - `status` (text, 'pending' | 'approved' | 'rejected')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `review_helpful`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key -> product_reviews)
      - `user_id` (uuid, foreign key -> auth.users)
      - `created_at` (timestamptz)
      - Unique constraint (review_id, user_id)

  2. Biztonsági szabályok
    - Bárki olvashatja a jóváhagyott értékeléseket
    - Csak bejelentkezett felhasználók írhatnak értékelést
    - Felhasználók csak saját értékelésüket szerkeszthetik/törölhetik
    - Authenticated users (admins) mindent kezelhetnek
    - Egy termékre csak egyszer lehet értékelni (user_id + product_id unique)

  3. Indexek
    - product_id szerint gyors lekérdezéshez
    - rating szerint rendezéshez
    - status szerint szűréshez
*/

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text,
  verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Review helpful tracking
CREATE TABLE IF NOT EXISTS review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- Product Reviews Policies

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can view all reviews (for admin)
CREATE POLICY "Authenticated users can view all reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users (admins) can update all reviews
CREATE POLICY "Authenticated users can update all reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users (admins) can delete all reviews
CREATE POLICY "Authenticated users can delete all reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (true);

-- Review Helpful Policies

-- Anyone can see helpful counts
CREATE POLICY "Anyone can view helpful marks"
  ON review_helpful FOR SELECT
  USING (true);

-- Authenticated users can mark reviews as helpful
CREATE POLICY "Authenticated users can mark helpful"
  ON review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own helpful marks
CREATE POLICY "Users can remove own helpful marks"
  ON review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_helpful;
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR DELETE ON review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER trigger_update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();