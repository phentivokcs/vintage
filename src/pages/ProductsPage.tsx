import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import SEO from '../components/SEO';

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  const gender = searchParams.get('gender');
  const clothingType = searchParams.get('clothing_type');
  const search = searchParams.get('q');
  const onSale = searchParams.get('sale') === 'true';

  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sizes: [] as string[],
    brands: [] as string[],
  });

  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [gender, clothingType, search, filters, sortBy, onSale]);

  const fetchBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('id, name')
      .order('name');

    if (data) setBrands(data);
  };

  const fetchProducts = async () => {
    setLoading(true);

    let query = supabase
      .from('products')
      .select(`
        *,
        brand:brands(id, name, slug),
        category:categories(id, name, slug),
        images:product_images(id, url, is_cover, sort_order),
        variants(id, price_gross, price_net, attributes, stock_quantity, status, discount_price_gross, discount_start_date, discount_end_date)
      `)
      .eq('published', true)
      .eq('status', 'active')
      .eq('validation_status', 'complete');

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
      return;
    }

    let filteredProducts = data || [];

    if (gender) {
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => v.attributes?.gender === gender)
      );
    }

    if (clothingType) {
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => v.attributes?.clothing_type === clothingType)
      );
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => v.price_gross >= minPrice)
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => v.price_gross <= maxPrice)
      );
    }

    if (filters.sizes.length > 0) {
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => v.attributes?.size && filters.sizes.includes(v.attributes.size))
      );
    }

    if (filters.brands.length > 0) {
      filteredProducts = filteredProducts.filter(p =>
        p.brand_id && filters.brands.includes(p.brand_id)
      );
    }

    if (onSale) {
      filteredProducts = filteredProducts.filter(p =>
        p.variants?.some(v => {
          if (!v.discount_price_gross || !v.discount_start_date || !v.discount_end_date) {
            return false;
          }
          const now = new Date();
          return now >= new Date(v.discount_start_date) && now <= new Date(v.discount_end_date);
        })
      );
    }

    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.variants?.[0]?.price_gross || 0) - (b.variants?.[0]?.price_gross || 0);
        case 'price-desc':
          return (b.variants?.[0]?.price_gross || 0) - (a.variants?.[0]?.price_gross || 0);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setProducts(filteredProducts);
    setLoading(false);
  };

  const getPageTitle = () => {
    if (search) return `Keresés: "${search}"`;

    const genderText = gender === 'men' ? 'Férfi' : gender === 'women' ? 'Női' : '';
    const clothingTypeMap: { [key: string]: string } = {
      polo: 'Pólók',
      sweater: 'Pulóverek',
      pants: 'Nadrágok',
      jacket: 'Kabátok',
      hat: 'Sapkák',
      shirt: 'Ingek',
      hoodie: 'Kapucnis pulóverek',
      dress: 'Ruhák',
      skirt: 'Szoknyák',
      shorts: 'Shortok',
      accessories: 'Kiegészítők',
      set: 'Szettek',
    };

    if (genderText && clothingType) {
      const clothingText = clothingTypeMap[clothingType] || clothingType;
      return `${genderText} ${clothingText}`;
    }

    if (genderText) return `${genderText} ruházat`;
    if (clothingType) return clothingTypeMap[clothingType] || clothingType;
    if (onSale) return 'Akciós termékek';

    return 'Összes termék';
  };

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const toggleBrand = (brandId: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(b => b !== brandId)
        : [...prev.brands, brandId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      sizes: [],
      brands: [],
    });
  };

  const pageTitle = getPageTitle();

  return (
    <>
      <SEO
        title={`${pageTitle} - VintageVibes`}
        description={`${pageTitle} - Válassz több száz használt márkás ruha közül. Kiváló árak, fenntartható divat.`}
        keywords={`${pageTitle}, használt ruha, vintage, márkás ruha, second hand`}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Legújabb</option>
              <option value="price-asc">Ár: növekvő</option>
              <option value="price-desc">Ár: csökkenő</option>
              <option value="name-asc">Név: A-Z</option>
              <option value="name-desc">Név: Z-A</option>
            </select>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Szűrők
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className={`${filterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white p-6 rounded-lg shadow-sm h-fit`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Szűrők</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Törlés
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Ár (Ft)</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Méret</h3>
                <div className="space-y-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.sizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Márka</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand.id)}
                        onChange={() => toggleBrand(brand.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Nincs találat</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {products.length} termék
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
