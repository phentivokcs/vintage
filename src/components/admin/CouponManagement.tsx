import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Plus, Trash2, Edit2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    min_order_value: '',
    max_discount: '',
    usage_limit: '',
    per_user_limit: '1',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setCoupons(data);
    }
  };

  const generateCouponCode = () => {
    const prefix = 'THANK10';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const couponData = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        per_user_limit: parseInt(form.per_user_limit),
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: form.is_active,
      };

      if (editingCoupon) {
        await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
      } else {
        await supabase.from('coupons').insert(couponData);
      }

      await loadCoupons();
      resetForm();
      alert(editingCoupon ? 'Kupon frissítve!' : 'Kupon létrehozva!');
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Hiba történt a kupon mentése során!');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_value: coupon.min_order_value.toString(),
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_user_limit: coupon.per_user_limit.toString(),
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törlöd ezt a kupont?')) return;

    await supabase.from('coupons').delete().eq('id', id);
    await loadCoupons();
  };

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_value: '',
      max_discount: '',
      usage_limit: '',
      per_user_limit: '1',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Kuponkezelés</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-5 h-5" />
          Új kupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingCoupon ? 'Kupon szerkesztése' : 'Új kupon létrehozása'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kuponkód *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 uppercase"
                    placeholder="KUPONKÓD"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, code: generateCouponCode() })}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Generálás
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kedvezmény típusa *
                </label>
                <select
                  required
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                >
                  <option value="percentage">Százalék (%)</option>
                  <option value="fixed_amount">Fix összeg (HUF)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kedvezmény értéke *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder={form.discount_type === 'percentage' ? '10' : '1000'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. rendelési érték (HUF)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.min_order_value}
                  onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="0"
                />
              </div>

              {form.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max. kedvezmény (HUF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                    placeholder="Nincs limit"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Felhasználási limit (összes)
                </label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Nincs limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Felhasználási limit (per felhasználó) *
                </label>
                <input
                  type="number"
                  required
                  value={form.per_user_limit}
                  onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Érvényes-től *
                </label>
                <input
                  type="date"
                  required
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Érvényes-ig
                </label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktív</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Mentés...' : editingCoupon ? 'Frissítés' : 'Létrehozás'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kód</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kedvezmény</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min. érték</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Felhasználás</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Érvényesség</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Státusz</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Műveletek</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gray-400" />
                    <span className="font-mono font-bold text-sm">{coupon.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : formatPrice(coupon.discount_value)}
                  {coupon.max_discount && (
                    <span className="text-gray-500 text-xs ml-1">
                      (max: {formatPrice(coupon.max_discount)})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon.min_order_value > 0 ? formatPrice(coupon.min_order_value) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon.usage_count}
                  {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                  <span className="text-gray-500 text-xs ml-1">
                    ({coupon.per_user_limit}x/fő)
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(coupon.valid_from).toLocaleDateString('hu-HU')}
                  {coupon.valid_until && (
                    <> - {new Date(coupon.valid_until).toLocaleDateString('hu-HU')}</>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      coupon.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {coupon.is_active ? 'Aktív' : 'Inaktív'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Még nincsenek kuponok</p>
          </div>
        )}
      </div>
    </div>
  );
}
