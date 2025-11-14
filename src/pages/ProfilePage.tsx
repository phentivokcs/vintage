import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Package, Heart, MapPin, Edit2, Save, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_gross: number;
  order_items: Array<{
    quantity: number;
    price_gross: number;
    variants: {
      products: {
        title: string;
      };
    };
  }>;
}

type Tab = 'orders' | 'favorites' | 'profile' | 'review';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = '/bejelentkezes';
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email || authUser.email || '',
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          zip: userData.zip,
        });
        setProfileForm({
          name: userData.name || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          zip: userData.zip || '',
        });
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
        });
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          total_gross,
          order_items(
            quantity,
            unit_price_gross,
            variant:variants(
              product:products(title)
            )
          )
        `)
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
      }

      setOrders(ordersData || []);

      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select(`
          product_id,
          products(
            *,
            brand:brands(*),
            category:categories(*),
            images:product_images(*),
            variants(*)
          )
        `)
        .eq('user_id', authUser.id);

      const favoriteProducts = wishlistData?.map(item => item.products).filter(Boolean) || [];
      setFavorites(favoriteProducts as Product[]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          name: profileForm.name || null,
          phone: profileForm.phone || null,
          address: profileForm.address || null,
          city: profileForm.city || null,
          zip: profileForm.zip || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Profil sikeresen frissítve!');
      setEditMode(false);
      await loadUserData();
    } catch (error: any) {
      alert('Hiba történt: ' + error.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Függőben',
      paid: 'Fizetve',
      processing: 'Feldolgozás alatt',
      shipped: 'Szállítás alatt',
      delivered: 'Kézbesítve',
      cancelled: 'Törölve',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-vintage-cream-light rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.name || 'Profil'}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-vintage-cream-light rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 inline-block mr-2" />
                Rendeléseim
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'favorites'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Heart className="w-5 h-5 inline-block mr-2" />
                Kedvencek
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-5 h-5 inline-block mr-2" />
                Szállítási adatok
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'review'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="w-5 h-5 inline-block mr-2" />
                Értékelés írása
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Korábbi rendelések</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Még nincs rendelésed</p>
                    <a
                      href="/termekek"
                      className="inline-block mt-4 px-6 py-2 bg-vintage-red text-white rounded-lg hover:bg-vintage-red/90"
                    >
                      Vásárolj most
                    </a>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rendelés #{order.order_number || order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            {formatPrice(order.total_gross)}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Termékek:
                        </p>
                        <div className="space-y-1">
                          {order.order_items.map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {item.variant?.product?.title} - {item.quantity} db
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Kedvenc termékek</h2>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Még nincs kedvenc terméked</p>
                    <a
                      href="/termekek"
                      className="inline-block mt-4 px-6 py-2 bg-vintage-red text-white rounded-lg hover:bg-vintage-red/90"
                    >
                      Böngészd a termékeket
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Szállítási adatok</h2>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      <Edit2 className="w-4 h-4" />
                      Szerkesztés
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setProfileForm({
                            name: user.name || '',
                            phone: user.phone || '',
                            address: user.address || '',
                            city: user.city || '',
                            zip: user.zip || '',
                          });
                        }}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Mégse
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-4 py-2 bg-vintage-red text-white rounded-lg hover:bg-vintage-red/90"
                      >
                        <Save className="w-4 h-4" />
                        Mentés
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Név
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900">{user.name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonszám
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900">{user.phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cím
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, address: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900">{user.address || '-'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Város
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, city: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.city || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Irányítószám
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profileForm.zip}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, zip: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.zip || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'review' && <WriteReviewTab orders={orders} userId={user?.id || ''} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function WriteReviewTab({ orders, userId }: { orders: Order[]; userId: string }) {
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    orderId: '',
  });

  useEffect(() => {
    checkExistingReview();
  }, [userId]);

  async function checkExistingReview() {
    try {
      const { data } = await supabase
        .from('store_reviews')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setExistingReview(data);

      if (data) {
        setFormData({
          rating: data.rating,
          title: data.title,
          comment: data.comment || '',
          orderId: data.order_id,
        });
      }
    } catch (error) {
      console.error('Értékelés ellenőrzése sikertelen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.orderId) {
      alert('Válassz egy rendelést!');
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from('store_reviews')
          .update({
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        alert('Értékelésed frissítve!');
      } else {
        const { error } = await supabase
          .from('store_reviews')
          .insert({
            user_id: userId,
            order_id: formData.orderId,
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
            status: 'approved',
          });

        if (error) throw error;
        alert('Köszönjük az értékelésed!');
      }

      checkExistingReview();
    } catch (error: any) {
      console.error('Értékelés mentése sikertelen:', error);
      alert('Hiba történt: ' + (error.message || 'Próbáld újra!'));
    } finally {
      setSubmitting(false);
    }
  }

  const completedOrders = orders.filter(order =>
    order.status === 'paid' || order.status === 'completed' || order.status === 'shipped'
  );

  if (loading) {
    return <div className="text-center py-8">Betöltés...</div>;
  }

  if (completedOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Még nem rendeltél tőlünk</p>
        <p className="text-sm text-gray-400">Értékelést csak teljesített rendelés után írhatsz.</p>
        <a
          href="/termekek"
          className="inline-block mt-4 px-6 py-2 bg-vintage-red text-white rounded-lg hover:bg-vintage-red/90"
        >
          Vásárolj most
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-6">
        {existingReview ? 'Értékelésed szerkesztése' : 'Értékeld a boltot'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!existingReview && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Válassz rendelést *
            </label>
            <select
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Válassz...</option>
              {completedOrders.map(order => (
                <option key={order.id} value={order.id}>
                  Rendelés #{order.id.slice(0, 8)} - {new Date(order.created_at).toLocaleDateString('hu-HU')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Értékelés *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= formData.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cím *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            placeholder="Rövid összefoglaló"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vélemény (opcionális)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            placeholder="Részletes vélemény a vásárlási élményről"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors disabled:bg-gray-400"
        >
          {submitting ? 'Küldés...' : existingReview ? 'Frissítés' : 'Értékelés küldése'}
        </button>
      </form>
    </div>
  );
}
