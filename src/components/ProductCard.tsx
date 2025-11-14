import { useState, useEffect } from 'react';
import { Product } from '../types';
import { Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.images?.find(img => img.is_cover) || product.images?.[0];
  const mainVariant = product.variants?.[0];
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

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

  useEffect(() => {
    loadWishlistCount();
  }, [product.id]);

  const loadWishlistCount = async () => {
    const { data, error } = await supabase.rpc('get_product_wishlist_count', {
      p_product_id: product.id
    });
    if (!error && data !== null) {
      setWishlistCount(data);
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

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
    await loadWishlistCount();
  };

  return (
    <a href={`/p/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4]">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Nincs kép
          </div>
        )}

        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 flex items-center gap-1.5"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
          {wishlistCount > 0 && (
            <span className="text-xs font-semibold text-gray-700">{wishlistCount}</span>
          )}
        </button>

        {hasActiveDiscount && originalPrice && displayPrice && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
            -{calculateDiscountPercent(originalPrice, displayPrice)}%
          </div>
        )}

        {mainVariant?.is_unique_piece && !hasActiveDiscount && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">
            Egyedi darab
          </div>
        )}

        {product.condition && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full">
            {conditionLabels[product.condition] || product.condition}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {product.brand && (
              <p className="text-sm text-gray-500 font-medium">{product.brand.name}</p>
            )}
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {product.title}
            </h3>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {displayPrice && (
            <>
              <span className={`text-lg font-bold ${hasActiveDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                {formatPrice(displayPrice)}
              </span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              {!hasActiveDiscount && product.original_price_gross && product.original_price_gross > displayPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.original_price_gross)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </a>
  );
}
