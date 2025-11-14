import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <Header />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/termekek" element={<ProductsPage />} />
                <Route path="/p/:slug" element={<ProductDetailPage />} />
                <Route path="/kosar" element={<CartPage />} />
                <Route path="/bejelentkezes" element={<LoginPage />} />
                <Route path="/penztar" element={<CheckoutPage />} />
                <Route path="/rendeles/:orderId/megerosites" element={<OrderConfirmationPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/fiok" element={<ProfilePage />} />
                <Route path="/szallitas" element={<ShippingPage />} />
                <Route path="/visszakuldes" element={<ReturnsPage />} />
                <Route path="/aszf" element={<TermsPage />} />
                <Route path="/adatvedelem" element={<PrivacyPage />} />
                <Route path="/kapcsolat" element={<ContactPage />} />
              </Routes>
            </main>

            <Footer />
            </div>
          </CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
