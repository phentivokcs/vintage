import { useState, useEffect } from 'react';
import { Lock, FileText, Ticket, Zap, MessageSquare, Star, Percent, Smartphone, Users } from 'lucide-react';
import { Package, Upload, List, ShoppingBag, BarChart3 } from 'lucide-react';
import Dashboard from '../components/admin/Dashboard';
import ProductUpload from '../components/admin/ProductUpload';
import BulkImport from '../components/admin/BulkImport';
import ProductList from '../components/admin/ProductList';
import OrderManagement from '../components/admin/OrderManagement';
import ContentManagement from '../components/admin/ContentManagement';
import CouponManagement from '../components/admin/CouponManagement';
import FlashSaleManagement from '../components/admin/FlashSaleManagement';
import ContactMessages from '../components/admin/ContactMessages';
import StoreReviewManagement from '../components/admin/StoreReviewManagement';
import DiscountManagement from '../components/admin/DiscountManagement';
import QuickUpload from '../components/admin/QuickUpload';
import UserManagement from '../components/admin/UserManagement';
import { supabase } from '../lib/supabase';

type Tab = 'dashboard' | 'quick' | 'upload' | 'bulk' | 'list' | 'orders' | 'content' | 'coupons' | 'flash-sales' | 'messages' | 'reviews' | 'discounts' | 'users';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const timeoutId = setTimeout(() => {
        console.warn('Auth check timeout - setting loading to false');
        setLoading(false);
      }, 5000);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      clearTimeout(timeoutId);

      if (sessionError) {
        console.error('Session error:', sessionError);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const userMetadata = session.user.app_metadata;
        const isUserAdmin = userMetadata?.role === 'admin';

        setIsAuthenticated(true);
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          setError('Nincs admin jogosultságod. Kérlek lépj kapcsolatba az adminisztrátorral.');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Hibás email cím vagy jelszó');
        return;
      }

      if (data.user) {
        const userMetadata = data.user.app_metadata;
        const isUserAdmin = userMetadata?.role === 'admin';

        if (isUserAdmin) {
          setIsAuthenticated(true);
          setIsAdmin(true);
          setError('');
        } else {
          setError('Nincs admin jogosultságod. Csak adminisztrátorok léphetnek be.');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Hiba történt a bejelentkezés során');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setEmail('');
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-32">
        <div className="max-w-md w-full">
          <div className="bg-vintage-cream-light rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Bejelentkezés szükséges</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email cím
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="admin@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jelszó
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Írd be a jelszót"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Bejelentkezés...' : 'Belépés'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-vintage-cream-light border-vintage-beige/20-b pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Termékek kezelése és feltöltése</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium absolute right-8"
            >
              Kilépés
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-vintage-cream-light rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline-block mr-2" />
                Áttekintés
              </button>
              <button
                onClick={() => setActiveTab('quick')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'quick'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-5 h-5 inline-block mr-2" />
                Gyors feltöltés
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'upload'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 inline-block mr-2" />
                Új termék
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bulk'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                Tömeges import
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'list'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="w-5 h-5 inline-block mr-2" />
                Terméklista
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingBag className="w-5 h-5 inline-block mr-2" />
                Rendelések
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'content'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 inline-block mr-2" />
                Tartalom Kezelés
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'coupons'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Ticket className="w-5 h-5 inline-block mr-2" />
                Kuponok
              </button>
              <button
                onClick={() => setActiveTab('flash-sales')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'flash-sales'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Zap className="w-5 h-5 inline-block mr-2" />
                Flash Sale
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-5 h-5 inline-block mr-2" />
                Üzenetek
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="w-5 h-5 inline-block mr-2" />
                Értékelések
              </button>
              <button
                onClick={() => setActiveTab('discounts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'discounts'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Percent className="w-5 h-5 inline-block mr-2" />
                Akciók
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Felhasználók
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'quick' && <QuickUpload />}
            {activeTab === 'upload' && <ProductUpload />}
            {activeTab === 'bulk' && <BulkImport />}
            {activeTab === 'list' && <ProductList />}
            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'content' && <ContentManagement />}
            {activeTab === 'coupons' && <CouponManagement />}
            {activeTab === 'flash-sales' && <FlashSaleManagement />}
            {activeTab === 'messages' && <ContactMessages />}
            {activeTab === 'reviews' && <StoreReviewManagement />}
            {activeTab === 'discounts' && <DiscountManagement />}
            {activeTab === 'users' && <UserManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}
