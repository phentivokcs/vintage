import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { ShoppingCart, Heart, Truck, Shield, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import SEO from '../components/SEO';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();
  const { assets } = useSiteContent();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*),
          category:categories(*),
          product_images(*),
          variants(*)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        const variantsWithInventory = await Promise.all(
          (data.variants || []).map(async (variant: any) => {
            const { data: inventory } = await supabase
              .from('inventory')
              .select('*')
              .eq('variant_id', variant.id)
              .maybeSingle();

            return {
              ...variant,
              inventory,
            };
          })
        );

        setProduct({
          ...data,
          variants: variantsWithInventory,
        } as Product);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.variants?.[0]) return;

    setAddingToCart(true);
    try {
      await addToCart(
        product.variants[0].id,
        1,
        product.variants[0].price_gross
      );
      toast.success('Termék hozzáadva a kosárhoz!');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast.error('Hiba történt: ' + (error.message || 'Kérjük, próbáld újra!'));
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const conditionLabels: Record<string, string> = {
    mint: 'Új',
    like_new: 'Kitűnő',
    excellent: 'Kiváló',
    good: 'Jó',
    fair: 'Elfogadható',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Termék nem található</h2>
          <a href="/" className="text-gray-600 hover:text-gray-900">
            Vissza a főoldalra
          </a>
        </div>
      </div>
    );
  }

  const mainVariant = product.variants?.[0];
  const images = product.product_images || [];
  const inStock = mainVariant?.inventory?.quantity_available > 0;

  const hasActiveDiscount = mainVariant?.discount_price_gross &&
    mainVariant?.discount_start_date &&
    mainVariant?.discount_end_date &&
    new Date() >= new Date(mainVariant.discount_start_date) &&
    new Date() <= new Date(mainVariant.discount_end_date);

  const displayPrice = hasActiveDiscount ? mainVariant.discount_price_gross : mainVariant?.price_gross;
  const originalPrice = hasActiveDiscount ? mainVariant.price_gross : null;

  const calculateDiscountPercent = (original: number, discount: number) => {
    return Math.round(((original - discount) / original) * 100);
  };

  return (
    <>
      <SEO
        title={`${product.title} - ${product.brand?.name || 'VintageVibes'}`}
        description={product.description || `${product.title} - Használt márkás ruha kiváló állapotban. Vásárolj most!`}
        keywords={`${product.brand?.name || ''}, ${product.title}, használt ruha, vintage, ${product.category?.name || ''}`}
        image={images[0]?.url}
        type="product"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Vissza
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Nincs kép
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-gray-900' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.brand && (
              <p className="text-gray-600 font-medium mb-2">{product.brand.name}</p>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>

            {hasActiveDiscount && originalPrice && displayPrice && (
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-red-600 text-white text-lg font-bold rounded-full">
                  -{calculateDiscountPercent(originalPrice, displayPrice)}% AKCIÓ
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              {displayPrice && (
                <>
                  <span className={`text-3xl font-bold ${hasActiveDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatPrice(displayPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  {!hasActiveDiscount && product.original_price_gross && product.original_price_gross > displayPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.original_price_gross)}
                    </span>
                  )}
                </>
              )}
            </div>

            {hasActiveDiscount && mainVariant?.discount_end_date && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">
                  Az akció vége: {new Date(mainVariant.discount_end_date).toLocaleDateString('hu-HU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              {product.condition && (
                <span className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  Állapot: {conditionLabels[product.condition] || product.condition}
                </span>
              )}
              {mainVariant?.is_unique_piece && !hasActiveDiscount && (
                <span className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-full">
                  Egyedi darab
                </span>
              )}
            </div>

            {mainVariant?.attributes?.size && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Méret</p>
                <div className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-900 rounded-lg font-semibold">
                  {mainVariant.attributes.size}
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? 'Hozzáadás...' : inStock ? 'Kosárba' : 'Elfogyott'}
              </button>

              <button
                onClick={() => product && toggleWishlist(product.id)}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  product && isInWishlist(product.id)
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-900'
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${
                    product && isInWishlist(product.id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
              </button>
            </div>

            {product.description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Termék leírása</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.condition_description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Állapot részletei</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{product.condition_description}</p>
                </div>
              </div>
            )}

            {mainVariant?.attributes && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Méretek</h2>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {['polo', 'shirt', 'jacket', 'sweater', 'hoodie', 'dress'].includes(mainVariant.attributes?.clothing_type) ? (
                      assets?.size_guide_tops?.public_url ? (
                        <img
                          src={assets.size_guide_tops.public_url}
                          alt="Felsők méretmutató"
                          className="w-32 h-auto"
                        />
                      ) : (
                        <svg width="120" height="140" viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 40 L45 35 Q45 33 47 33 L73 33 L73 40" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <path d="M110 40 L115 35 Q115 33 113 33 L87 33 L87 40" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <rect x="50" y="40" width="60" height="8" rx="2" fill="#D1D5DB" stroke="#374151" strokeWidth="2"/>
                          <rect x="55" y="48" width="50" height="65" rx="4" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <ellipse cx="80" cy="70" rx="18" ry="15" fill="#E5E7EB" stroke="#374151" strokeWidth="1.5"/>
                          <path d="M55 50 L35 60 L35 95 Q35 97 37 97 L50 97" stroke="#374151" strokeWidth="2" fill="#F3F4F6"/>
                          <path d="M105 50 L125 60 L125 95 Q125 97 123 97 L110 97" stroke="#374151" strokeWidth="2" fill="#F3F4F6"/>
                          <line x1="33" y1="60" x2="33" y2="95" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="33,60 29,65 37,65" fill="#EF4444"/>
                          <polygon points="33,95 29,90 37,90" fill="#EF4444"/>
                          <line x1="48" y1="40" x2="112" y2="40" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="48,40 53,36 53,44" fill="#EF4444"/>
                          <polygon points="112,40 107,36 107,44" fill="#EF4444"/>
                          <line x1="53" y1="50" x2="107" y2="50" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="53,50 58,46 58,54" fill="#EF4444"/>
                          <polygon points="107,50 102,46 102,54" fill="#EF4444"/>
                          <line x1="135" y1="48" x2="135" y2="113" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="135,48 131,53 139,53" fill="#EF4444"/>
                          <polygon points="135,113 131,108 139,108" fill="#EF4444"/>
                        </svg>
                      )
                    ) : mainVariant.attributes?.clothing_type === 'pants' ? (
                      assets?.size_guide_pants?.public_url ? (
                        <img
                          src={assets.size_guide_pants.public_url}
                          alt="Nadrágok méretmutató"
                          className="w-32 h-auto"
                        />
                      ) : (
                        <svg width="120" height="160" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="50" y="30" width="60" height="12" rx="3" fill="#D1D5DB" stroke="#374151" strokeWidth="2"/>
                          <path d="M55 42 L52 70 L48 130 L48 170 Q48 172 50 172 L60 172 Q62 172 62 170 L67 100 L70 65"
                                fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <path d="M105 42 L108 70 L112 130 L112 170 Q112 172 110 172 L100 172 Q98 172 98 170 L93 100 L90 65"
                                fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <rect x="67" y="42" width="26" height="50" rx="2" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                          <ellipse cx="80" cy="67" rx="10" ry="8" fill="#E5E7EB"/>
                          <line x1="135" y1="42" x2="135" y2="172" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="135,42 131,47 139,47" fill="#EF4444"/>
                          <polygon points="135,172 131,167 139,167" fill="#EF4444"/>
                          <line x1="48" y1="36" x2="112" y2="36" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="48,36 53,32 53,40" fill="#EF4444"/>
                          <polygon points="112,36 107,32 107,40" fill="#EF4444"/>
                          <line x1="45" y1="70" x2="115" y2="70" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="45,70 50,66 50,74" fill="#EF4444"/>
                          <polygon points="115,70 110,66 110,74" fill="#EF4444"/>
                          <line x1="46" y1="172" x2="64" y2="172" stroke="#EF4444" strokeWidth="2.5"/>
                          <polygon points="46,172 51,168 51,176" fill="#EF4444"/>
                          <polygon points="64,172 59,168 59,176" fill="#EF4444"/>
                        </svg>
                      )
                    ) : (
                      <svg width="120" height="140" viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 40 L45 35 Q45 33 47 33 L73 33 L73 40" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                        <path d="M110 40 L115 35 Q115 33 113 33 L87 33 L87 40" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                        <rect x="55" y="40" width="50" height="60" rx="4" fill="#F3F4F6" stroke="#374151" strokeWidth="2"/>
                        <path d="M55 45 L35 55 L35 85 Q35 87 37 87 L50 87" stroke="#374151" strokeWidth="2" fill="#F3F4F6"/>
                        <path d="M105 45 L125 55 L125 85 Q125 87 123 87 L110 87" stroke="#374151" strokeWidth="2" fill="#F3F4F6"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {['hoodie', 'sweater', 'jacket'].includes(mainVariant.attributes?.clothing_type) && (
                    <>
                      {mainVariant.attributes.totalLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Hossz:</span>
                          <span className="font-medium">{mainVariant.attributes.totalLength} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.shoulderWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Vállszélesség:</span>
                          <span className="font-medium">{mainVariant.attributes.shoulderWidth} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.sleeveLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Ujjhossz:</span>
                          <span className="font-medium">{mainVariant.attributes.sleeveLength} cm</span>
                        </div>
                      )}
                    </>
                  )}

                  {['polo', 'shirt'].includes(mainVariant.attributes?.clothing_type) && (
                    <>
                      {mainVariant.attributes.totalLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Hossz:</span>
                          <span className="font-medium">{mainVariant.attributes.totalLength} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.shoulderWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Vállszélesség:</span>
                          <span className="font-medium">{mainVariant.attributes.shoulderWidth} cm</span>
                        </div>
                      )}
                    </>
                  )}

                  {mainVariant.attributes?.clothing_type === 'pants' && (
                    <>
                      {mainVariant.attributes.totalLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Hossz:</span>
                          <span className="font-medium">{mainVariant.attributes.totalLength} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.hipWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Csípőbőség:</span>
                          <span className="font-medium">{mainVariant.attributes.hipWidth} cm</span>
                        </div>
                      )}
                    </>
                  )}

                  {!['hoodie', 'sweater', 'jacket', 'polo', 'shirt', 'pants'].includes(mainVariant.attributes?.clothing_type) && (
                    <>
                      {mainVariant.attributes.chestWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Mellbőség:</span>
                          <span className="font-medium">{mainVariant.attributes.chestWidth} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.waistWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Derékbőség:</span>
                          <span className="font-medium">{mainVariant.attributes.waistWidth} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.hipWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Csípőbőség:</span>
                          <span className="font-medium">{mainVariant.attributes.hipWidth} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.shoulderWidth && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Vállszélesség:</span>
                          <span className="font-medium">{mainVariant.attributes.shoulderWidth} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.sleeveLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Ujjhossz:</span>
                          <span className="font-medium">{mainVariant.attributes.sleeveLength} cm</span>
                        </div>
                      )}
                      {mainVariant.attributes.totalLength && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Teljes hossz:</span>
                          <span className="font-medium">{mainVariant.attributes.totalLength} cm</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Ingyenes szállítás</p>
                  <p className="text-sm text-gray-600">15.000 Ft feletti rendelés esetén</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">14 napos visszaküldés</p>
                  <p className="text-sm text-gray-600">Ingyenes visszaküldési lehetőség</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
