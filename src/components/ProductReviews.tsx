import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProductReview } from '../types';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, [productId]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:users!product_reviews_user_id_fkey(full_name, name)
        `)
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Értékelések betöltése sikertelen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Jelentkezz be az értékeléshez!');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment,
          verified_purchase: false,
          status: 'approved',
        });

      if (error) {
        if (error.code === '23505') {
          alert('Már értékelted ezt a terméket!');
        } else {
          throw error;
        }
      } else {
        alert('Köszönjük az értékelésed!');
        setFormData({ rating: 5, title: '', comment: '' });
        setShowReviewForm(false);
        fetchReviews();
      }
    } catch (error) {
      console.error('Értékelés mentése sikertelen:', error);
      alert('Hiba történt az értékelés mentésekor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHelpful(reviewId: string) {
    if (!user) {
      alert('Jelentkezz be a szavazáshoz!');
      return;
    }

    try {
      const { error } = await supabase
        .from('review_helpful')
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          alert('Már hasznosnak jelölted ezt az értékelést!');
        } else {
          throw error;
        }
      } else {
        fetchReviews();
      }
    } catch (error) {
      console.error('Hasznos jelölés sikertelen:', error);
    }
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return <div className="py-8 text-center">Értékelések betöltése...</div>;
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Vásárlói értékelések</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500">
                ({reviews.length} értékelés)
              </span>
            </div>
          )}
        </div>

        {user && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Értékelés írása
          </button>
        )}
      </div>

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Írj értékelést</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Értékelés</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Cím</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Rövid összefoglaló"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Vélemény (opcionális)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Részletes vélemény a termékről"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Küldés...' : 'Értékelés küldése'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Mégse
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Még nincs értékelés ehhez a termékhez. Legyél te az első!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{review.title}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {review.user?.full_name || review.user?.name || 'Névtelen'} •{' '}
                    {new Date(review.created_at).toLocaleDateString('hu-HU')}
                    {review.verified_purchase && (
                      <span className="ml-2 text-green-600">✓ Ellenőrzött vásárlás</span>
                    )}
                  </p>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-3">{review.comment}</p>
              )}

              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ThumbsUp className="w-4 h-4" />
                Hasznos ({review.helpful_count})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
