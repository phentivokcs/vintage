import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            brand:brands(*),
            category:categories(*)
          `)
          .eq('published', true)
          .eq('status', 'active')
          .eq('validation_status', 'complete')
          .order('created_at', { ascending: false })
          .limit(8);

        if (productsError) throw productsError;

        if (productsData) {
          const productsWithDetails = await Promise.all(
            productsData.map(async (product) => {
              const { data: images } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', product.id)
                .order('sort_order', { ascending: true });

              const { data: variants } = await supabase
                .from('variants')
                .select(`
                  *,
                  inventory(*)
                `)
                .eq('product_id', product.id);

              return {
                ...product,
                images: images || [],
                variants: variants || [],
              };
            })
          );

          setProducts(productsWithDetails as Product[]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Új érkezések</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-lg"></div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Új érkezések</h2>
          <p className="text-center text-gray-600">
            Jelenleg nincsenek elérhető termékek. Hamarosan érkeznek új darabok!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Új érkezések</h2>
          <a
            href="/uj-erkezesek"
            className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
          >
            Összes megtekintése →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
