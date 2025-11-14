import { useState, useEffect } from 'react';
import { Lock, FileText, Ticket, Zap, MessageSquare, Star, Percent, Smartphone } from 'lucide-react';
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

type Tab = 'dashboard' | 'quick' | 'upload' | 'bulk' | 'list' | 'orders' | 'content' | 'coupons' | 'flash-sales' | 'messages' | 'reviews' | 'discounts';

const ADMIN_PASSWORD = 'admin2024';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Hibás jelszó');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-32">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Jelszó szükséges a belépéshez</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Belépés
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Termékek kezelése és feltöltése</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAuth');
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium absolute right-8"
            >
              Kilépés
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
