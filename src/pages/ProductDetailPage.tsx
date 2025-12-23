import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { ShoppingCart, Heart, Truck, Shield, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import ProductReviews from '../components/ProductReviews';
import SEO from '../components/SEO';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
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
      alert('Termék hozzáadva a kosárhoz!');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      alert('Hiba történt: ' + (error.message || 'Kérjük, próbáld újra!'));
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

  return (
    <>
      <SEO
        title={`${product.title} - ${product.brand?.name || 'ReStyle'}`}
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

            <div className="flex items-center gap-4 mb-6">
              {mainVariant && (
                <>
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(mainVariant.price_gross)}
                  </span>
                  {product.original_price_gross && product.original_price_gross > mainVariant.price_gross && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.original_price_gross)}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.condition && (
                <span className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  Állapot: {conditionLabels[product.condition] || product.condition}
                </span>
              )}
              {mainVariant?.is_unique_piece && (
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
                <h2 className="text-xl font-bold text-gray-900 mb-3">Méretek</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
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

        <ProductReviews productId={product.id} />
        </div>
      </div>
    </>
  );
}
