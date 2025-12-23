import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Edit, Search, Loader2 } from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        brand:brands(name),
        category:categories(name),
        product_images(url, is_primary),
        variants(id, sku, price_gross, stock_quantity, attributes)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load error:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a terméket?')) return;

    setDeleting(productId);

    try {
      const { data: variants } = await supabase
        .from('variants')
        .select('id')
        .eq('product_id', productId);

      if (variants) {
        for (const variant of variants) {
          await supabase.from('cart_items').delete().eq('variant_id', variant.id);
        }
      }

      await supabase.from('variants').delete().eq('product_id', productId);
      await supabase.from('product_images').delete().eq('product_id', productId);

      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      alert('Termék sikeresen törölve!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Törlési hiba: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.brand?.name.toLowerCase().includes(searchLower) ||
      product.variants?.some((v: any) => v.sku.toLowerCase().includes(searchLower))
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Termékek betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Keresés termék név, márka vagy SKU alapján..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Frissítés
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Találatok: {filteredProducts.length} / {products.length}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Nincs találat' : 'Még nincsenek termékek'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const primaryImage = product.product_images?.find((img: any) => img.is_primary);
            const variant = product.variants?.[0];

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Nincs kép
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {product.title}
                  </h3>

                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    {product.brand && <p>Márka: {product.brand.name}</p>}
                    {product.category && <p>Kategória: {product.category.name}</p>}
                    {variant && (
                      <>
                        <p>SKU: {variant.sku}</p>
                        <p>Méret: {variant.attributes?.size || '-'}</p>
                        <p className="font-semibold text-gray-900">
                          {formatPrice(variant.price_gross)}
                        </p>
                        <p>
                          Készlet:{' '}
                          <span
                            className={
                              variant.stock_quantity > 0
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {variant.stock_quantity} db
                          </span>
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Törlés
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
