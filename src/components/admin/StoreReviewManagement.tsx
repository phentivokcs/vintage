import { useState, useEffect } from 'react';
import { Star, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StoreReview {
  id: string;
  user_id: string;
  order_id: string;
  rating: number;
  title: string;
  comment: string | null;
  helpful_count: number;
  status: string;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

export default function StoreReviewManagement() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const { data, error } = await supabase
        .from('store_reviews')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Értékelések betöltése sikertelen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt az értékelést?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.filter(review => review.id !== id));
      alert('Értékelés törölve!');
    } catch (error) {
      console.error('Törlés sikertelen:', error);
      alert('Hiba történt a törlés során!');
    }
  }

  async function handleToggleStatus(review: StoreReview) {
    const newStatus = review.status === 'approved' ? 'hidden' : 'approved';

    try {
      const { error } = await supabase
        .from('store_reviews')
        .update({ status: newStatus })
        .eq('id', review.id);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === review.id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Státusz frissítés sikertelen:', error);
      alert('Hiba történt a státusz frissítése során!');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Betöltés...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bolt Értékelések</h2>
        <p className="text-gray-600">Kezeld a vásárlók által írt bolt értékeléseket</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Még nincs értékelés</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-lg p-6 ${
                review.status === 'hidden' ? 'opacity-60 border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {review.rating}/5
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {review.title}
                  </h3>
                  {review.comment && (
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{review.users?.name || 'Ismeretlen'}</span>
                    <span>{review.users?.email}</span>
                    <span>{new Date(review.created_at).toLocaleDateString('hu-HU')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(review)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.status === 'approved'
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={review.status === 'approved' ? 'Elrejtés' : 'Megjelenítés'}
                  >
                    {review.status === 'approved' ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Törlés"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {review.status === 'hidden' && (
                <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  Ez az értékelés jelenleg rejtett
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Statisztika</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Összes értékelés:</span>
            <span className="ml-2 font-semibold">{reviews.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Látható:</span>
            <span className="ml-2 font-semibold">
              {reviews.filter(r => r.status === 'approved').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Rejtett:</span>
            <span className="ml-2 font-semibold">
              {reviews.filter(r => r.status === 'hidden').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
