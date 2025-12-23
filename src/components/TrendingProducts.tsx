import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { TrendingUp } from 'lucide-react';

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingProducts();
  }, []);

  const loadTrendingProducts = async () => {
    try {
      const { data: trendingData, error: trendingError } = await supabase.rpc('get_trending_products', {
        limit_count: 10
      });

      if (trendingError) {
        console.error('Error loading trending products:', trendingError);
        setLoading(false);
        return;
      }

      if (!trendingData || trendingData.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = trendingData.map((item: any) => item.product_id);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*),
          category:categories(*),
          product_images(*),
          variants(*)
        `)
        .in('id', productIds)
        .eq('status', 'active');

      if (productsError) {
        console.error('Error loading product details:', productsError);
        setLoading(false);
        return;
      }

      const productsWithInventory = await Promise.all(
        (productsData || []).map(async (product: any) => {
          const variantsWithInventory = await Promise.all(
            (product.variants || []).map(async (variant: any) => {
              const { data: inventory } = await supabase
                .from('inventory')
                .select('*')
                .eq('variant_id', variant.id)
                .maybeSingle();

              return {
                ...variant,
                inventory: inventory || null,
              };
            })
          );

          return {
            ...product,
            images: product.product_images || [],
            variants: variantsWithInventory,
          };
        })
      );

      const sortedProducts = productIds
        .map(id => productsWithInventory.find(p => p.id === id))
        .filter(Boolean) as Product[];

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            Legkeresettebb
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Legkedveltebb termékeink
          </h2>
          <p className="text-lg text-gray-600">
            Ezeket a ruhákat kedvelik a legtöbben
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
