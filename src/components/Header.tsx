import { ShoppingCart, Search, User, Menu, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menDropdownOpen, setMenDropdownOpen] = useState(false);
  const [womenDropdownOpen, setWomenDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const menCategories = [
    { name: 'Pulóverek', slug: 'puloverek', gender: 'male' },
    { name: 'Pólók', slug: 'polok', gender: 'male' },
    { name: 'Nadrágok', slug: 'nadragok', gender: 'male' },
    { name: 'Kabátok', slug: 'kabatok', gender: 'male' },
    { name: 'Sapkák', slug: 'sapkak', gender: 'male' },
  ];

  const womenCategories = [
    { name: 'Pulóverek', slug: 'puloverek', gender: 'female' },
    { name: 'Pólók', slug: 'polok', gender: 'female' },
    { name: 'Nadrágok', slug: 'nadragok', gender: 'female' },
    { name: 'Kabátok', slug: 'kabatok', gender: 'female' },
    { name: 'Sapkák', slug: 'sapkak', gender: 'female' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/termekek?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <a href="/" className="text-2xl font-bold text-gray-900 ml-2 lg:ml-0">
              ReStyle
            </a>
          </div>

          <nav className="hidden lg:flex items-center space-x-8 ml-10 flex-1">
            <div
              className="relative"
              onMouseEnter={() => setMenDropdownOpen(true)}
              onMouseLeave={() => setMenDropdownOpen(false)}
            >
              <a
                href="/termekek?gender=male"
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                Férfi
                <ChevronDown className="w-4 h-4" />
              </a>

              {menDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  {menCategories.map(cat => (
                    <a
                      key={cat.slug}
                      href={`/termekek?gender=${cat.gender}&category=${cat.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {cat.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setWomenDropdownOpen(true)}
              onMouseLeave={() => setWomenDropdownOpen(false)}
            >
              <a
                href="/termekek?gender=female"
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                Női
                <ChevronDown className="w-4 h-4" />
              </a>

              {womenDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  {womenCategories.map(cat => (
                    <a
                      key={cat.slug}
                      href={`/termekek?gender=${cat.gender}&category=${cat.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {cat.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/termekek?new=true" className="text-gray-700 hover:text-gray-900 font-medium">
              Új érkezések
            </a>
            <a href="/termekek?sale=true" className="text-red-600 hover:text-red-700 font-medium">
              Akciók
            </a>
            <a href="/kapcsolat" className="text-gray-700 hover:text-gray-900 font-medium">
              Kapcsolat
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            <a href="/fiok" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-5 h-5 text-gray-700" />
            </a>

            <a href="/kosar" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </a>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keresés... (pl. női pulcsi, Nike cipő)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200">
          <nav className="px-4 py-4 space-y-3">
            <div>
              <a href="/termekek?gender=male" className="block text-gray-900 font-medium mb-2">
                Férfi
              </a>
              <div className="pl-4 space-y-2">
                {menCategories.map(cat => (
                  <a
                    key={cat.slug}
                    href={`/termekek?gender=${cat.gender}&category=${cat.slug}`}
                    className="block text-sm text-gray-600 hover:text-gray-900"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <a href="/termekek?gender=female" className="block text-gray-900 font-medium mb-2">
                Női
              </a>
              <div className="pl-4 space-y-2">
                {womenCategories.map(cat => (
                  <a
                    key={cat.slug}
                    href={`/termekek?gender=${cat.gender}&category=${cat.slug}`}
                    className="block text-sm text-gray-600 hover:text-gray-900"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>

            <a href="/termekek?new=true" className="block text-gray-700 hover:text-gray-900 font-medium">
              Új érkezések
            </a>
            <a href="/termekek?sale=true" className="block text-red-600 hover:text-red-700 font-medium">
              Akciók
            </a>
            <a href="/kapcsolat" className="block text-gray-700 hover:text-gray-900 font-medium">
              Kapcsolat
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
