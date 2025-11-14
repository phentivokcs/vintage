import { ShoppingCart, Search, User, Menu, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContentContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menDropdownOpen, setMenDropdownOpen] = useState(false);
  const [womenDropdownOpen, setWomenDropdownOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { content } = useSiteContent();

  const menCategories = [
    { name: 'Pólók', clothing_type: 'polo' },
    { name: 'Pulóverek', clothing_type: 'sweater' },
    { name: 'Kapucnis pulóverek', clothing_type: 'hoodie' },
    { name: 'Nadrágok', clothing_type: 'pants' },
    { name: 'Shortok', clothing_type: 'shorts' },
    { name: 'Kabátok', clothing_type: 'jacket' },
    { name: 'Sapkák', clothing_type: 'hat' },
    { name: 'Kiegészítők', clothing_type: 'accessories' },
    { name: 'Szettek', clothing_type: 'set' },
  ];

  const womenCategories = [
    { name: 'Pólók', clothing_type: 'polo' },
    { name: 'Pulóverek', clothing_type: 'sweater' },
    { name: 'Kapucnis pulóverek', clothing_type: 'hoodie' },
    { name: 'Nadrágok', clothing_type: 'pants' },
    { name: 'Shortok', clothing_type: 'shorts' },
    { name: 'Kabátok', clothing_type: 'jacket' },
    { name: 'Sapkák', clothing_type: 'hat' },
    { name: 'Kiegészítők', clothing_type: 'accessories' },
    { name: 'Szettek', clothing_type: 'set' },
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
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-8 h-8" />
            </button>

            <a href="/" className="ml-2 lg:ml-0">
              {content.design.logo ? (
                <img src={content.design.logo} alt="Logo" className="h-24 w-auto" />
              ) : (
                <span className="text-2xl font-bold">VintageVibes</span>
              )}
            </a>
          </div>

          <nav className="hidden lg:flex items-center ml-10 flex-1">
            <div className="relative">
              <button
                onClick={() => setMainMenuOpen(!mainMenuOpen)}
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 px-4 py-2 text-lg"
              >
                Menü
                <ChevronDown className="w-5 h-5" />
              </button>

              {mainMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  <div className="relative group">
                    <button
                      onClick={() => setMenDropdownOpen(!menDropdownOpen)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium flex items-center justify-between text-base"
                    >
                      Férfi
                      <ChevronDown className="w-5 h-5" />
                    </button>

                    {menDropdownOpen && (
                      <div className="pl-4 bg-gray-50">
                        {menCategories.map(cat => (
                          <a
                            key={cat.clothing_type}
                            href={`/termekek?gender=men&clothing_type=${cat.clothing_type}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            {cat.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <button
                      onClick={() => setWomenDropdownOpen(!womenDropdownOpen)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium flex items-center justify-between text-base"
                    >
                      Női
                      <ChevronDown className="w-5 h-5" />
                    </button>

                    {womenDropdownOpen && (
                      <div className="pl-4 bg-gray-50">
                        {womenCategories.map(cat => (
                          <a
                            key={cat.clothing_type}
                            href={`/termekek?gender=women&clothing_type=${cat.clothing_type}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            {cat.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <a
                    href="/termekek?new=true"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  >
                    Új érkezések
                  </a>

                  <a
                    href="/termekek?sale=true"
                    className="block px-4 py-2 text-red-600 hover:bg-gray-50 hover:text-red-700 font-medium"
                  >
                    Akciók
                  </a>

                  <a
                    href="/termekek?clothing_type=collector"
                    className="block px-4 py-2 text-amber-600 hover:bg-gray-50 hover:text-amber-700 font-medium"
                  >
                    Gyűjtői darabok
                  </a>

                  <a
                    href="/kapcsolat"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  >
                    Kapcsolat
                  </a>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-6 h-6 text-gray-700" />
            </button>

            <a href="/fiok" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </a>

            <a href="/kosar" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold">
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
        <div className="lg:hidden border-t border-gray-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <nav className="px-4 py-4 space-y-3">
            <div>
              <a href="/termekek?gender=men" className="block text-gray-900 font-medium mb-2">
                Férfi
              </a>
              <div className="pl-4 space-y-2">
                {menCategories.map(cat => (
                  <a
                    key={cat.clothing_type}
                    href={`/termekek?gender=men&clothing_type=${cat.clothing_type}`}
                    className="block text-sm text-gray-600 hover:text-gray-900"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <a href="/termekek?gender=women" className="block text-gray-900 font-medium mb-2">
                Női
              </a>
              <div className="pl-4 space-y-2">
                {womenCategories.map(cat => (
                  <a
                    key={cat.clothing_type}
                    href={`/termekek?gender=women&clothing_type=${cat.clothing_type}`}
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
            <a href="/termekek?clothing_type=collector" className="block text-amber-600 hover:text-amber-700 font-medium">
              Gyűjtői darabok
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
