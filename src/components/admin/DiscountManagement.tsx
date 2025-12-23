import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Percent, Save, X } from 'lucide-react';

interface Variant {
  id: string;
  sku: string;
  size: string;
  price_gross: number;
  discount_price_gross: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
}

interface ProductWithVariants extends Product {
  variants: Variant[];
}

export default function DiscountManagement() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*),
          category:categories(*),
          product_images(*),
          variants(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithImages = (data || []).map((product: any) => ({
        ...product,
        images: product.product_images || [],
      }));

      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (
    variantId: string,
    discountPrice: number | null,
    startDate: string | null,
    endDate: string | null
  ) => {
    setSaving(variantId);
    try {
      const { error } = await supabase
        .from('variants')
        .update({
          discount_price_gross: discountPrice,
          discount_start_date: startDate,
          discount_end_date: endDate,
        })
        .eq('id', variantId);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Error updating discount:', error);
      alert('Hiba történt az akció mentésekor');
    } finally {
      setSaving(null);
    }
  };

  const removeDiscount = async (variantId: string) => {
    await updateDiscount(variantId, null, null, null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscountPercent = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const isDiscountActive = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return false;
    const now = new Date();
    return now >= new Date(startDate) && now <= new Date(endDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Percent className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Akciók kezelése</h2>
          <p className="text-gray-600">Állíts be akciókat a termékekre</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const coverImage = product.images?.find(img => img.is_cover) || product.images?.[0];

          return (
            <div key={product.id} className="bg-white border rounded-lg p-6">
              <div className="flex gap-4 mb-4">
                {coverImage && (
                  <img
                    src={coverImage.url}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  {product.brand && (
                    <p className="text-sm text-gray-600">{product.brand.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {product.variants?.map((variant) => (
                  <VariantDiscountForm
                    key={variant.id}
                    variant={variant}
                    onSave={updateDiscount}
                    onRemove={removeDiscount}
                    saving={saving === variant.id}
                    formatPrice={formatPrice}
                    calculateDiscountPercent={calculateDiscountPercent}
                    isDiscountActive={isDiscountActive}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface VariantDiscountFormProps {
  variant: Variant;
  onSave: (id: string, price: number | null, start: string | null, end: string | null) => void;
  onRemove: (id: string) => void;
  saving: boolean;
  formatPrice: (price: number) => string;
  calculateDiscountPercent: (original: number, discount: number) => number;
  isDiscountActive: (start: string | null, end: string | null) => boolean;
}

function VariantDiscountForm({
  variant,
  onSave,
  onRemove,
  saving,
  formatPrice,
  calculateDiscountPercent,
  isDiscountActive,
}: VariantDiscountFormProps) {
  const [discountPrice, setDiscountPrice] = useState(
    variant.discount_price_gross?.toString() || ''
  );
  const [startDate, setStartDate] = useState(
    variant.discount_start_date ? variant.discount_start_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    variant.discount_end_date ? variant.discount_end_date.split('T')[0] : ''
  );

  const hasDiscount = variant.discount_price_gross !== null;
  const active = isDiscountActive(variant.discount_start_date, variant.discount_end_date);

  const handleSave = () => {
    const price = discountPrice ? parseFloat(discountPrice) : null;

    if (price && price >= variant.price_gross) {
      alert('Az akciós ár nem lehet nagyobb vagy egyenlő az eredeti árnál');
      return;
    }

    if (price && (!startDate || !endDate)) {
      alert('Add meg az akció kezdő és befejező dátumát');
      return;
    }

    onSave(
      variant.id,
      price,
      startDate ? new Date(startDate).toISOString() : null,
      endDate ? new Date(endDate + 'T23:59:59').toISOString() : null
    );
  };

  const handleRemove = () => {
    if (confirm('Biztosan eltávolítod ezt az akciót?')) {
      onRemove(variant.id);
      setDiscountPrice('');
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-medium">Méret: {variant.size}</span>
          <span className="text-sm text-gray-600 ml-3">
            Eredeti ár: {formatPrice(variant.price_gross)}
          </span>
          {hasDiscount && active && (
            <span className="ml-3 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
              Aktív akció
            </span>
          )}
          {hasDiscount && !active && (
            <span className="ml-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
              Inaktív akció
            </span>
          )}
        </div>
        {hasDiscount && (
          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 p-1"
            title="Akció törlése"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Akciós ár (Ft)
          </label>
          <input
            type="number"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder={variant.price_gross.toString()}
            min="0"
            max={variant.price_gross}
          />
          {discountPrice && parseFloat(discountPrice) < variant.price_gross && (
            <p className="text-xs text-green-600 mt-1">
              -{calculateDiscountPercent(variant.price_gross, parseFloat(discountPrice))}%
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kezdő dátum
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Befejező dátum
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            min={startDate}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {saving ? (
              'Mentés...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Mentés
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
