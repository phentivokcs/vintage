import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Trash2, Edit, Search, Loader2, X, Plus } from 'lucide-react';

export default function ProductList() {
  const toast = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
        brand:brands(id, name),
        category:categories(id, name),
        product_images(id, url, is_cover, sort_order),
        variants(id, sku, price_gross, price_net, vat_rate, stock_quantity, attributes)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load error:', error);
    } else {
      const updatedProducts = (data || []).map(product => ({
        ...product,
        validation_status: product.validation_status || 'incomplete'
      }));
      setProducts(updatedProducts);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a terméket?')) return;

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
      toast.success('Termék sikeresen törölve!');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Törlési hiba: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      product.title.toLowerCase().includes(searchLower) ||
      product.brand?.name.toLowerCase().includes(searchLower) ||
      product.variants?.some((v: any) => v.sku.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return product.status === 'active' && product.validation_status === 'complete';
    if (statusFilter === 'sold') return product.status === 'sold';
    if (statusFilter === 'incomplete') return product.status !== 'active' && product.status !== 'sold' || product.validation_status !== 'complete';
    if (statusFilter === 'needs_image') return product.validation_status === 'needs_image';
    if (statusFilter === 'needs_price') return product.validation_status === 'needs_price';
    if (statusFilter === 'needs_size') return product.validation_status === 'needs_size';

    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string, validationStatus: string) => {
    if (status === 'sold') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          ✓ Eladva
        </span>
      );
    }

    if (status !== 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Inaktív
        </span>
      );
    }

    switch (validationStatus) {
      case 'complete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Aktív
          </span>
        );
      case 'needs_image':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Kép kell
          </span>
        );
      case 'needs_price':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Ár kell
          </span>
        );
      case 'needs_size':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Méret kell
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Hiányos
          </span>
        );
    }
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">Termék állapotok</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Aktív:</strong> A termék látható a boltban (van kép, ár és méret)</li>
          <li><strong>Eladva:</strong> A termék elkelt, már nem látható a boltban</li>
          <li><strong>Kép kell:</strong> Legalább egy kép feltöltése szükséges</li>
          <li><strong>Ár kell:</strong> Variáns létrehozása árral szükséges</li>
          <li><strong>Méret kell:</strong> A variánsokhoz méret megadása szükséges</li>
          <li><strong>Inaktív:</strong> A termék státusza nem aktív</li>
        </ul>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Keresés termék név, márka vagy SKU alapján..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
        >
          <option value="all">Minden termék</option>
          <option value="active">Csak aktív</option>
          <option value="sold">Eladott termékek</option>
          <option value="incomplete">Hiányos termékek</option>
          <option value="needs_image">Kép kell</option>
          <option value="needs_price">Ár kell</option>
          <option value="needs_size">Méret kell</option>
        </select>

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
            const coverImage = product.product_images?.find((img: any) => img.is_cover) || product.product_images?.[0];
            const variant = product.variants?.[0];

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  {coverImage ? (
                    <img
                      src={coverImage.url}
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
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {product.title}
                    </h3>
                    {getStatusBadge(product.status || 'draft', product.validation_status)}
                  </div>

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

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Termék állapot
                    </label>
                    <select
                      value={product.status || 'draft'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          const { error } = await supabase
                            .from('products')
                            .update({ status: newStatus })
                            .eq('id', product.id);

                          if (error) throw error;

                          setProducts(products.map(p =>
                            p.id === product.id ? { ...p, status: newStatus } : p
                          ));
                          toast.success('Állapot sikeresen frissítve!');
                        } catch (error: any) {
                          toast.error('Állapot frissítési hiba: ' + error.message);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="active">Aktív</option>
                      <option value="draft">Inaktív (draft)</option>
                      <option value="archived">Inaktív (archived)</option>
                      <option value="sold">Eladva</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Szerkesztés
                    </button>
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

      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={async (updatedProduct, newImages, deletedImages, imageOrder) => {
            try {
              const { error } = await supabase
                .from('products')
                .update({
                  brand_id: updatedProduct.brand_id,
                  category_id: updatedProduct.category_id,
                  title: updatedProduct.title,
                  description: updatedProduct.description,
                  condition: updatedProduct.condition,
                  condition_description: updatedProduct.condition_description,
                })
                .eq('id', updatedProduct.id);

              if (error) throw error;

              if (updatedProduct.variant) {
                const priceGross = parseFloat(updatedProduct.variant.price_gross);
                const vatRate = 27;
                const priceNet = priceGross / (1 + vatRate / 100);

                const { error: variantError } = await supabase
                  .from('variants')
                  .update({
                    price_gross: priceGross,
                    price_net: priceNet,
                    stock_quantity: parseInt(updatedProduct.variant.stock_quantity),
                    attributes: updatedProduct.variant.attributes,
                  })
                  .eq('id', updatedProduct.variant.id);

                if (variantError) throw variantError;
              }

              for (const imageId of deletedImages) {
                await supabase.from('product_images').delete().eq('id', imageId);
              }

              for (let i = 0; i < imageOrder.length; i++) {
                const image = imageOrder[i];
                await supabase
                  .from('product_images')
                  .update({
                    sort_order: i,
                    is_cover: i === 0
                  })
                  .eq('id', image.id);
              }

              for (let i = 0; i < newImages.length; i++) {
                const file = newImages[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${updatedProduct.id}/${Date.now()}-${i}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('products')
                  .upload(fileName, file);

                if (uploadError) {
                  console.error('Image upload error:', uploadError);
                  continue;
                }

                const { data: urlData } = supabase.storage
                  .from('products')
                  .getPublicUrl(fileName);

                await supabase.from('product_images').insert({
                  product_id: updatedProduct.id,
                  url: urlData.publicUrl,
                  sort_order: imageOrder.length + i,
                  is_cover: false,
                });
              }

              toast.success('Termék sikeresen frissítve!');
              setEditingProduct(null);
              loadProducts();
            } catch (error: any) {
              console.error('Update error:', error);
              toast.error('Frissítési hiba: ' + error.message);
            }
          }}
        />
      )}
    </div>
  );
}

interface ProductEditModalProps {
  product: any;
  onClose: () => void;
  onSave: (product: any, newImages: File[], deletedImages: string[], imageOrder: any[]) => void;
}

function ProductEditModal({ product, onClose, onSave }: ProductEditModalProps) {
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(product.product_images || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id: product.id,
    brand_id: product.brand?.id || '',
    category_id: product.category?.id || '',
    title: product.title || '',
    description: product.description || '',
    condition: product.condition || 'excellent',
    condition_description: product.condition_description || '',
    variant: product.variants?.[0] ? {
      id: product.variants[0].id,
      price_gross: product.variants[0].price_gross || 0,
      stock_quantity: product.variants[0].stock_quantity || 0,
      attributes: product.variants[0].attributes || {},
    } : null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [brandsRes, categoriesRes] = await Promise.all([
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (brandsRes.data) setBrands(brandsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...existingImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setExistingImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Termék szerkesztése</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Márka
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Válassz márkát...</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategória
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Válassz kategóriát...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Termék neve
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leírás
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Állapot
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            >
              <option value="new">Új</option>
              <option value="excellent">Kiváló</option>
              <option value="good">Jó</option>
              <option value="fair">Megfelelő</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Állapot leírása
            </label>
            <textarea
              value={formData.condition_description}
              onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {formData.variant && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Variáns adatok</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ár (Ft)
                  </label>
                  <input
                    type="number"
                    value={formData.variant.price_gross}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: { ...formData.variant!, price_gross: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Készlet (db)
                  </label>
                  <input
                    type="number"
                    value={formData.variant.stock_quantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: { ...formData.variant!, stock_quantity: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méret
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.size || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, size: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Szín
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.color || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, color: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nem
                  </label>
                  <select
                    value={formData.variant.attributes?.gender || 'unisex'}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, gender: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Férfi</option>
                    <option value="women">Női</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ruha típus
                  </label>
                  <select
                    value={formData.variant.attributes?.clothing_type || 'polo'}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, clothing_type: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="polo">Póló</option>
                    <option value="shirt">Ing</option>
                    <option value="pants">Nadrág</option>
                    <option value="jacket">Kabát</option>
                    <option value="sweater">Pulóver</option>
                    <option value="hoodie">Kapucnis pulóver</option>
                    <option value="dress">Ruha</option>
                    <option value="skirt">Szoknya</option>
                    <option value="shorts">Short</option>
                    <option value="hat">Sapka</option>
                    <option value="accessories">Kiegészítő</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Részletes méretek (opcionális)</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {['polo', 'shirt', 'jacket', 'sweater', 'hoodie', 'dress'].includes(formData.variant?.attributes?.clothing_type) ? (
                      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="70" cy="20" r="12" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <path d="M50 35 Q50 32 52 32 L68 32 L68 35" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <path d="M90 35 Q90 32 88 32 L72 32 L72 35" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <rect x="52" y="35" width="36" height="45" rx="3" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <path d="M52 40 L40 50 L40 75 Q40 77 42 77 L48 77" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
                        <path d="M88 40 L100 50 L100 75 Q100 77 98 77 L92 77" stroke="#6B7280" strokeWidth="1.5" fill="none"/>

                        <line x1="50" y1="45" x2="90" y2="45" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="50" y1="45" x2="54" y2="41" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="50" y1="45" x2="54" y2="49" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="90" y1="45" x2="86" y2="41" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="90" y1="45" x2="86" y2="49" stroke="#EF4444" strokeWidth="2"/>

                        <line x1="50" y1="35" x2="90" y2="35" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="50" y1="35" x2="54" y2="31" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="50" y1="35" x2="54" y2="39" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="90" y1="35" x2="86" y2="31" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="90" y1="35" x2="86" y2="39" stroke="#EF4444" strokeWidth="2"/>

                        <line x1="110" y1="35" x2="110" y2="80" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="110" y1="35" x2="106" y2="39" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="35" x2="114" y2="39" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="80" x2="106" y2="76" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="80" x2="114" y2="76" stroke="#EF4444" strokeWidth="2"/>

                        <line x1="35" y1="50" x2="35" y2="75" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="35" y1="50" x2="31" y2="54" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="35" y1="50" x2="39" y2="54" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="35" y1="75" x2="31" y2="71" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="35" y1="75" x2="39" y2="71" stroke="#EF4444" strokeWidth="2"/>
                      </svg>
                    ) : formData.variant?.attributes?.clothing_type === 'pants' ? (
                      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="45" y="20" width="50" height="8" rx="2" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <path d="M50 28 L48 45 L45 90 L45 120 Q45 122 47 122 L53 122 Q55 122 55 120 L58 70 L60 50"
                              fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <path d="M90 28 L92 45 L95 90 L95 120 Q95 122 93 122 L87 122 Q85 122 85 120 L82 70 L80 50"
                              fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <rect x="58" y="28" width="24" height="35" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>

                        <line x1="45" y1="24" x2="95" y2="24" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="45" y1="24" x2="49" y2="20" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="45" y1="24" x2="49" y2="28" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="95" y1="24" x2="91" y2="20" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="95" y1="24" x2="91" y2="28" stroke="#EF4444" strokeWidth="2"/>

                        <line x1="42" y1="45" x2="98" y2="45" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="42" y1="45" x2="46" y2="41" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="42" y1="45" x2="46" y2="49" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="98" y1="45" x2="94" y2="41" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="98" y1="45" x2="94" y2="49" stroke="#EF4444" strokeWidth="2"/>

                        <line x1="110" y1="28" x2="110" y2="120" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2"/>
                        <line x1="110" y1="28" x2="106" y2="32" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="28" x2="114" y2="32" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="120" x2="106" y2="116" stroke="#EF4444" strokeWidth="2"/>
                        <line x1="110" y1="120" x2="114" y2="116" stroke="#EF4444" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="70" cy="20" r="12" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <path d="M50 35 Q50 32 52 32 L68 32 L68 35" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <path d="M90 35 Q90 32 88 32 L72 32 L72 35" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <rect x="52" y="35" width="36" height="45" rx="3" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5"/>
                        <path d="M52 40 L40 50 L40 75 Q40 77 42 77 L48 77" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
                        <path d="M88 40 L100 50 L100 75 Q100 77 98 77 L92 77" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mellbőség (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.chestWidth || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, chestWidth: e.target.value }
                      }
                    })}
                    placeholder="52"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derékbőség (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.waistWidth || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, waistWidth: e.target.value }
                      }
                    })}
                    placeholder="42"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Csípőbőség (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.hipWidth || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, hipWidth: e.target.value }
                      }
                    })}
                    placeholder="48"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vállszélesség (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.shoulderWidth || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, shoulderWidth: e.target.value }
                      }
                    })}
                    placeholder="44"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ujjhossz (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.sleeveLength || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, sleeveLength: e.target.value }
                      }
                    })}
                    placeholder="62"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teljes hossz (cm)
                  </label>
                  <input
                    type="text"
                    value={formData.variant.attributes?.totalLength || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant: {
                        ...formData.variant!,
                        attributes: { ...formData.variant!.attributes, totalLength: e.target.value }
                      }
                    })}
                    placeholder="72"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Képek</h3>
            <p className="text-sm text-gray-600 mb-4">Húzd át a képeket a sorrend módosításához</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {existingImages
                ?.filter((img: any) => !deletedImageIds.includes(img.id))
                .map((image: any, index: number) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="relative group cursor-move"
                  >
                    <img
                      src={image.url}
                      alt="Product"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        #{index + 1}
                      </span>
                      {image.is_cover && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                          Borító
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Új képek hozzáadása
                    </p>
                  </div>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Mégse
          </button>
          <button
            onClick={() => onSave(formData, imageFiles, deletedImageIds, existingImages)}
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
}
