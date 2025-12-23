import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    variant: 'missingConfig' | 'fallback' | 'error' | 'empty';
    details?: string;
  } | null>(null);

  const demoProducts = useMemo<Product[]>(
    () => [
      {
        id: 'demo-1',
        title: 'Vintage farmerdzseki',
        slug: 'demo-vintage-farmerdzseki',
        brand: { id: 'demo-brand-1', name: 'Levi\'s', slug: 'levis' },
        category: { id: 'demo-cat-outer', name: 'Kabátok', slug: 'kabátok', sort_order: 1 },
        description: 'Ikonikus, kissé koptatott farmerdzseki, puha béléssel.',
        condition: 'excellent',
        gender: 'unisex',
        season: 'tavasz',
        original_price_gross: 42990,
        published: true,
        images: [
          {
            id: 'demo-img-1',
            product_id: 'demo-1',
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
            sort_order: 1,
            is_cover: true,
          },
        ],
        variants: [
          {
            id: 'demo-var-1',
            product_id: 'demo-1',
            sku: 'DEMO-001',
            price_gross: 22990,
            price_net: 18180,
            vat_rate: 27,
            currency: 'HUF',
            is_unique_piece: true,
          },
        ],
      },
      {
        id: 'demo-2',
        title: 'Retro sportcipő',
        slug: 'demo-retro-sportcipo',
        brand: { id: 'demo-brand-2', name: 'Adidas', slug: 'adidas' },
        category: { id: 'demo-cat-shoes', name: 'Cipők', slug: 'cipok', sort_order: 2 },
        description: 'Világos színvilágú, időtálló retro sneaker.',
        condition: 'like_new',
        gender: 'unisex',
        season: 'egész év',
        original_price_gross: 34990,
        published: true,
        images: [
          {
            id: 'demo-img-2',
            product_id: 'demo-2',
            url: 'https://images.unsplash.com/photo-1529902774135-3a5e0b80e5a8?auto=format&fit=crop&w=600&q=80',
            sort_order: 1,
            is_cover: true,
          },
        ],
        variants: [
          {
            id: 'demo-var-2',
            product_id: 'demo-2',
            sku: 'DEMO-002',
            price_gross: 18990,
            price_net: 14953,
            vat_rate: 27,
            currency: 'HUF',
            is_unique_piece: false,
          },
        ],
      },
      {
        id: 'demo-3',
        title: 'Oversize pulóver',
        slug: 'demo-oversize-pulover',
        brand: { id: 'demo-brand-3', name: 'Carhartt', slug: 'carhartt' },
        category: { id: 'demo-cat-tops', name: 'Felsők', slug: 'felsok', sort_order: 3 },
        description: 'Meleg, vastag anyagú pulóver, minimál logóval.',
        condition: 'excellent',
        gender: 'unisex',
        season: 'ősz/tél',
        original_price_gross: 25990,
        published: true,
        images: [
          {
            id: 'demo-img-3',
            product_id: 'demo-3',
            url: 'https://images.unsplash.com/photo-1542293787938-4d2246c5f16c?auto=format&fit=crop&w=600&q=80',
            sort_order: 1,
            is_cover: true,
          },
        ],
        variants: [
          {
            id: 'demo-var-3',
            product_id: 'demo-3',
            sku: 'DEMO-003',
            price_gross: 12990,
            price_net: 10236,
            vat_rate: 27,
            currency: 'HUF',
            is_unique_piece: true,
          },
        ],
      },
      {
        id: 'demo-4',
        title: 'Minimalista tote bag',
        slug: 'demo-minimalista-tote-bag',
        brand: { id: 'demo-brand-4', name: 'COS', slug: 'cos' },
        category: { id: 'demo-cat-accessories', name: 'Kiegészítők', slug: 'kiegeszitok', sort_order: 4 },
        description: 'Strapabíró vászontáska, hétköznapi használatra.',
        condition: 'mint',
        gender: 'unisex',
        season: 'egész év',
        original_price_gross: 15990,
        published: true,
        images: [
          {
            id: 'demo-img-4',
            product_id: 'demo-4',
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
            sort_order: 1,
            is_cover: true,
          },
        ],
        variants: [
          {
            id: 'demo-var-4',
            product_id: 'demo-4',
            sku: 'DEMO-004',
            price_gross: 7990,
            price_net: 6291,
            vat_rate: 27,
            currency: 'HUF',
            is_unique_piece: false,
          },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProducts(demoProducts);
      setIsDemoData(true);
      setDebugInfo({ variant: 'missingConfig' });
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        const baseQuery = supabase
          .from('products')
          .select(`
            *,
            brand:brands(*),
            category:categories(*)
          `)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(8);

        const filteredQuery = supabase
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

        const { data: filteredProducts, error: filteredError } = await filteredQuery;

        const shouldRetryWithoutOptionalColumns =
          filteredError && /status|validation_status|column .* does not exist/i.test(filteredError.message);

        if (shouldRetryWithoutOptionalColumns) {
          setDebugInfo({ variant: 'fallback', details: filteredError?.message });
        }

        const { data: productsData, error: productsError } = shouldRetryWithoutOptionalColumns
          ? await baseQuery
          : { data: filteredProducts, error: filteredError };

        if (productsError) {
          setDebugInfo({ variant: 'error', details: productsError.message });
          throw productsError;
        }

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

          if (productsWithDetails.length === 0) {
            setProducts(demoProducts);
            setIsDemoData(true);
            setDebugInfo({ variant: 'empty' });
          } else {
            setIsDemoData(false);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setDebugInfo((prev) => prev ?? { variant: 'error', details: (error as Error).message });
        setProducts(demoProducts);
        setIsDemoData(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [demoProducts]);

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
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-900">Új érkezések</h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm border ${
                isDemoData
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-green-200 bg-green-50 text-green-900'
              }`}
              title={
                isDemoData
                  ? 'Demó kártyákat mutatunk, amíg nincs élő Supabase adat.'
                  : 'Élő Supabase adatokat töltesz be.'
              }
            >
              {isDemoData ? 'Demó mód' : 'Élő adat'}
            </span>
          </div>
          <a
            href="/uj-erkezesek"
            className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
          >
            Összes megtekintése →
          </a>
        </div>

        {debugInfo?.variant === 'missingConfig' && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Most demó módban vagyunk.</p>
            <p className="mt-2 text-sm text-amber-800">
              Nincs megadva Supabase konfiguráció, ezért ideiglenes mintakártyákat mutatunk, hogy lásd a felületet. Ha
              szeretnéd az élő termékeket látni, add meg a <code>VITE_SUPABASE_URL</code> és
              <code>VITE_SUPABASE_ANON_KEY</code> értékeket az <code>.env</code> fájlban, majd indítsd újra az
              alkalmazást.
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Távoli környezetben (GitHub/Vercel) is tedd fel ezeket a kulcsokat és futtass új deployt, hogy a publikus
              oldal is az éles adatokat mutassa. Ha bárhol elakadsz, jelezz bátran — örömmel segítünk.
            </p>
          </div>
        )}

        {debugInfo?.variant === 'fallback' && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">
              A Supabase sémában hiányzik a <code>status</code> vagy <code>validation_status</code> oszlop.
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Lazább szűréssel töltöttük be az új érkezéseket, hogy legalább a publikált termékek megjelenjenek.
              Ha szeretnéd pontosabban szűrni az aktív, validált tételeket, egészítsd ki a Supabase
              <code>products</code> táblát a fenti mezőkkel. {debugInfo.details ? ` (Hibaüzenet: ${debugInfo.details})` : ''}
            </p>
          </div>
        )}

        {debugInfo?.variant === 'error' && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <p className="font-semibold">Nem sikerült betölteni a termékeket.</p>
            <p className="mt-2 text-sm text-red-800">
              Valami hiba történt a lekérdezésnél, ezért átváltottunk demó kártyákra. Ellenőrizd a Supabase kapcsolatot
              és a konzolban látható hibaüzeneteket — utána automatikusan visszaváltunk élő adatra.
              {debugInfo.details ? ` (Hibaüzenet: ${debugInfo.details})` : ''}
            </p>
          </div>
        )}

        {debugInfo?.variant === 'empty' && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <p className="font-semibold">A lekérdezés lefutott, de nincs publikált termék.</p>
            <p className="mt-2 text-sm text-blue-800">
              A termékek csak akkor jelennek meg, ha a <code>products</code> táblában a <code>published</code> érték igaz.
              Kapcsold be a publikálást néhány tételnél tesztként, és rögtön itt fognak megjelenni. Addig is demó
              kártyákat mutatunk, hogy lásd a szerkezetet.
            </p>
          </div>
        )}

        {isDemoData && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-gray-800 shadow-sm">
            <p className="font-semibold">Demó adatok</p>
            <p className="mt-2 text-sm text-gray-700">
              Ezek a kártyák statikus minták, hogy lásd a layoutot. Amint a Supabase kapcsolat rendben van és van
              publikált terméked, azonnal megjelennek itt az élő adatok. Ha kérdésed van a beállításról, szólj nyugodtan.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
