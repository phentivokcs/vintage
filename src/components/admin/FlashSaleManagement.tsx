import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface FlashSale {
  id: string;
  name: string;
  description?: string;
  discount_percentage: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
}

export default function FlashSaleManagement() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleProducts, setSaleProducts] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: 10,
    start_time: '',
    end_time: '',
    is_active: true,
  });

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  async function loadSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sales:', error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, title')
      .eq('published', true)
      .order('title');

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
    }
  }

  async function loadSaleProducts(saleId: string) {
    const { data } = await supabase
      .from('flash_sale_products')
      .select('product_id')
      .eq('flash_sale_id', saleId);

    setSaleProducts(data?.map(p => p.product_id) || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase
      .from('flash_sales')
      .insert([formData]);

    if (error) {
      alert('Hiba történt: ' + error.message);
    } else {
      alert('Akció sikeresen létrehozva!');
      setFormData({
        name: '',
        description: '',
        discount_percentage: 10,
        start_time: '',
        end_time: '',
        is_active: true,
      });
      setShowForm(false);
      loadSales();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Biztosan törlöd ezt az akciót?')) return;

    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Hiba történt: ' + error.message);
    } else {
      loadSales();
    }
  }

  async function toggleProduct(saleId: string, productId: string) {
    if (saleProducts.includes(productId)) {
      await supabase
        .from('flash_sale_products')
        .delete()
        .eq('flash_sale_id', saleId)
        .eq('product_id', productId);

      setSaleProducts(prev => prev.filter(id => id !== productId));
    } else {
      await supabase
        .from('flash_sale_products')
        .insert({
          flash_sale_id: saleId,
          product_id: productId,
        });

      setSaleProducts(prev => [...prev, productId]);
    }
  }

  function isActive(sale: FlashSale) {
    const now = new Date();
    const start = new Date(sale.start_time);
    const end = new Date(sale.end_time);
    return sale.is_active && now >= start && now <= end;
  }

  if (loading) {
    return <div>Betöltés...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Flash Sale / Akciók</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-5 h-5" />
          Új akció
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">Új akció létrehozása</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Név</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Leírás</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kedvezmény (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kezdés</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Befejezés</label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm">Aktív</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Létrehozás
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{sale.name}</h3>
                  {isActive(sale) && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Aktív most
                    </span>
                  )}
                </div>
                {sale.description && (
                  <p className="text-gray-600 text-sm mt-1">{sale.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="font-semibold text-red-600">
                    -{sale.discount_percentage}% kedvezmény
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(sale.start_time).toLocaleString('hu-HU')} - {new Date(sale.end_time).toLocaleString('hu-HU')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedSale === sale.id) {
                      setSelectedSale(null);
                    } else {
                      setSelectedSale(sale.id);
                      loadSaleProducts(sale.id);
                    }
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  {selectedSale === sale.id ? 'Bezár' : 'Termékek'}
                </button>
                <button
                  onClick={() => handleDelete(sale.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {selectedSale === sale.id && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Termékek az akcióban</h4>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={saleProducts.includes(product.id)}
                        onChange={() => toggleProduct(sale.id, product.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{product.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {sales.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Még nincs akció. Hozz létre egyet!
          </div>
        )}
      </div>
    </div>
  );
}
