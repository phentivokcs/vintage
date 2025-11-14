import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreReview {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  helpful_count: number;
  created_at: string;
  user?: {
    full_name?: string;
    name?: string;
    email?: string;
  };
}

export default function StoreReviews() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchReviews() {
    try {
      console.log('=== STORE REVIEWS DEBUG ===');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Starting fetch reviews...');

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('store_reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Reviews query result:');
      console.log('- Error:', reviewsError);
      console.log('- Data:', reviewsData);
      console.log('- Count:', reviewsData?.length || 0);

      if (reviewsError) {
        console.error('ERROR fetching reviews:', reviewsError);
        alert('Hiba: ' + reviewsError.message);
        setReviews([]);
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        console.log('No reviews found');
        setReviews([]);
        return;
      }

      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      console.log('Fetching users:', userIds);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, name, email')
        .in('id', userIds);

      console.log('Users query result:');
      console.log('- Error:', usersError);
      console.log('- Data:', usersData);

      if (usersError) {
        console.error('ERROR fetching users:', usersError);
      }

      const reviewsWithUsers = reviewsData.map(review => ({
        ...review,
        user: usersData?.find(u => u.id === review.user_id)
      }));

      console.log('Final reviews:', reviewsWithUsers);
      console.log('=== END DEBUG ===');

      setReviews(reviewsWithUsers);
    } catch (error) {
      console.error('CRITICAL ERROR:', error);
      alert('Kritikus hiba: ' + error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleHelpful(reviewId: string) {
    if (!user) {
      alert('Jelentkezz be a szavazáshoz!');
      return;
    }

    try {
      const { error } = await supabase
        .from('store_review_helpful')
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
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vásárlói vélemények</h2>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xl font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 text-lg">
                ({reviews.length} értékelés)
              </span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Még nincs értékelés. Vásárlás után te is írhatsz értékelést!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-vintage-cream-light rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
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
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                {review.comment && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-4">{review.comment}</p>
                )}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    {review.user?.full_name || review.user?.name || review.user?.email || 'Névtelen'} •{' '}
                    {new Date(review.created_at).toLocaleDateString('hu-HU')}
                  </p>
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {review.helpful_count}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
