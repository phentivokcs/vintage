import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Loader2, Plus, X } from 'lucide-react';

interface ProductForm {
  brandId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: string;
  conditionDescription: string;
  gender: string;
  clothingType: string;
  size: string;
  color: string;
  price: string;
  stock: string;
  measurements: {
    chestWidth?: string;
    waistWidth?: string;
    hipWidth?: string;
    shoulderWidth?: string;
    sleeveLength?: string;
    totalLength?: string;
  };
}

export default function ProductUpload() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState<ProductForm>({
    brandId: '',
    categoryId: '',
    title: '',
    description: '',
    condition: 'excellent',
    conditionDescription: '',
    gender: 'unisex',
    clothingType: 'polo',
    size: 'M',
    color: '',
    price: '',
    stock: '1',
    measurements: {},
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

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const price = parseFloat(form.price);
      const stock = parseInt(form.stock);

      const attributes: any = {
        size: form.size,
        color: form.color,
        condition: form.condition,
        gender: form.gender,
        clothing_type: form.clothingType,
      };

      Object.entries(form.measurements).forEach(([key, value]) => {
        if (value) {
          attributes[key] = value;
        }
      });

      // Generate slug from title
      const slug = form.title
        .toLowerCase()
        .replace(/[áàäâã]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöôõ]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ő/g, 'o')
        .replace(/ű/g, 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          brand_id: form.brandId || null,
          category_id: form.categoryId || null,
          title: form.title,
          slug: `${slug}-${Date.now()}`,
          description: form.description,
          condition: form.condition,
          condition_description: form.conditionDescription || null,
          status: 'active',
          published: true,
        })
        .select()
        .single();

      if (productError) throw productError;

      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${product.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error(`Kép feltöltési hiba: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }

      console.log('Image URLs to save:', imageUrls);

      for (let i = 0; i < imageUrls.length; i++) {
        const { error: imageError } = await supabase.from('product_images').insert({
          product_id: product.id,
          url: imageUrls[i],
          sort_order: i,
          is_cover: i === 0,
        });

        if (imageError) {
          console.error('Image save error:', imageError);
          toast.error(`Kép mentési hiba: ${imageError.message}`);
        }
      }

      // Calculate net price from gross price and VAT rate
      const vatRate = 27;
      const priceNet = price / (1 + vatRate / 100);

      const selectedCategory = categories.find(c => c.id === form.categoryId);
      const categorySlug = selectedCategory?.slug || 'felsok';

      const { data: skuData } = await supabase.rpc('generate_sku_for_category', {
        cat_slug: categorySlug
      });

      const generatedSku = skuData || `P${Math.floor(Math.random() * 1000)}`;

      const { error: variantError } = await supabase.from('variants').insert({
        product_id: product.id,
        sku: generatedSku,
        price_gross: price,
        price_net: priceNet,
        vat_rate: vatRate,
        attributes: attributes,
        stock_quantity: stock,
        status: 'active',
      });

      if (variantError) throw variantError;

      toast.success('Termék sikeresen feltöltve!');

      setForm({
        brandId: '',
        categoryId: '',
        title: '',
        description: '',
        condition: 'excellent',
        conditionDescription: '',
        gender: 'unisex',
        clothingType: 'polo',
        size: 'M',
        color: '',
        price: '',
        stock: '1',
        measurements: {},
      });
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Hiba történt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Márka
          </label>
          <select
            value={form.brandId}
            onChange={(e) => setForm({ ...form, brandId: e.target.value })}
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
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Termék neve *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="pl. Nike sportos póló"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leírás
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nem
          </label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            <option value="unisex">Unisex</option>
            <option value="men">Férfi</option>
            <option value="women">Női</option>
            <option value="kids">Gyerek</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ruha típus
          </label>
          <select
            value={form.clothingType}
            onChange={(e) => setForm({ ...form, clothingType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            <option value="polo">Póló</option>
            <option value="pants">Nadrág</option>
            <option value="jacket">Kabát</option>
            <option value="sweater">Pulóver</option>
            <option value="hoodie">Kapucnis pulóver</option>
            <option value="shorts">Short</option>
            <option value="hat">Sapka</option>
            <option value="accessories">Kiegészítő</option>
            <option value="set">Szett</option>
            <option value="collector">Gyűjtői darab</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Állapot
          </label>
          <select
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            <option value="new">Új</option>
            <option value="excellent">Kiváló</option>
            <option value="good">Jó</option>
            <option value="fair">Megfelelő</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Állapot részletes leírása
          </label>
          <textarea
            value={form.conditionDescription}
            onChange={(e) => setForm({ ...form, conditionDescription: e.target.value })}
            rows={3}
            placeholder="Részletes leírás az állapotról (pl. kisebb kopás a karon, apró folt a hátán stb.)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Méret *
          </label>
          <input
            type="text"
            required
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            placeholder="pl. M, L, 38, 42"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Szín
          </label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="pl. Fekete, Fehér, Kék"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ár (HUF) *
          </label>
          <input
            type="number"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="5990"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>SKU automatikus generálás:</strong> A rendszer automatikusan generál egy egyedi SKU kódot a kategória alapján (pl. Póló: T001, Pulcsi: H001, Nadrág: N001)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Készlet *
          </label>
          <input
            type="number"
            required
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Méretek (opcionális)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mellbőség (cm)
            </label>
            <input
              type="text"
              value={form.measurements.chestWidth || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, chestWidth: e.target.value },
                })
              }
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
              value={form.measurements.waistWidth || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, waistWidth: e.target.value },
                })
              }
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
              value={form.measurements.hipWidth || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, hipWidth: e.target.value },
                })
              }
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
              value={form.measurements.shoulderWidth || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, shoulderWidth: e.target.value },
                })
              }
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
              value={form.measurements.sleeveLength || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, sleeveLength: e.target.value },
                })
              }
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
              value={form.measurements.totalLength || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, totalLength: e.target.value },
                })
              }
              placeholder="72"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Képek</h3>
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
                  Kattints vagy húzd ide a képeket
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
                    onClick={() => removeImage(index)}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Feltöltés...
          </>
        ) : (
          'Termék feltöltése'
        )}
      </button>
    </form>
  );
}
