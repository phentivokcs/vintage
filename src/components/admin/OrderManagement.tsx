import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Eye, Truck, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_gross: number;
  created_at: string;
  shipping_address: any;
  users?: {
    email: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    price_gross: number;
    variants: {
      sku: string;
      attributes: any;
      products: {
        title: string;
      };
    };
  }>;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);

    let query = supabase
      .from('orders')
      .select(`
        *,
        users(email),
        order_items(
          id,
          quantity,
          price_gross,
          variants(
            sku,
            attributes,
            products(title)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Hiba a státusz frissítésekor: ' + error.message);
    } else {
      alert('Státusz sikeresen frissítve!');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Függőben',
      paid: 'Fizetve',
      processing: 'Feldolgozás alatt',
      shipped: 'Szállítás alatt',
      delivered: 'Kézbesítve',
      cancelled: 'Törölve',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Rendelések kezelése</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Összes rendelés</option>
            <option value="pending">Függőben</option>
            <option value="paid">Fizetve</option>
            <option value="processing">Feldolgozás alatt</option>
            <option value="shipped">Szállítás alatt</option>
            <option value="delivered">Kézbesítve</option>
            <option value="cancelled">Törölve</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nincs rendelés</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Rendelés #{order.id.slice(0, 8)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {order.users?.email || 'N/A'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(order.total_gross)}
                  </p>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Részletek
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Tételek:</h4>
                <div className="space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.variants?.products?.title} - {item.quantity} db
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.price_gross * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'paid')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Fizetve jelölés
                  </button>
                )}
                {order.status === 'paid' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Feldolgozás indítása
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Kiszállítva jelölés
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Kézbesítve jelölés
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Törlés
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-bold">
                Rendelés részletei #{selectedOrder.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Státusz</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Vásárló adatai</h4>
                <p className="text-sm text-gray-600">
                  Email: {selectedOrder.users?.email || 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Szállítási cím</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{selectedOrder.shipping_address?.name}</p>
                  <p>{selectedOrder.shipping_address?.address}</p>
                  <p>
                    {selectedOrder.shipping_address?.city},{' '}
                    {selectedOrder.shipping_address?.zip}
                  </p>
                  <p>{selectedOrder.shipping_address?.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rendelt termékek</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.variants?.products?.title}</p>
                          <p className="text-sm text-gray-600">SKU: {item.variants?.sku}</p>
                          <p className="text-sm text-gray-600">Mennyiség: {item.quantity} db</p>
                          {item.variants?.attributes && (
                            <p className="text-sm text-gray-600">
                              Méret: {item.variants.attributes.size}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(item.price_gross * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.price_gross)} / db
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Végösszeg:</span>
                  <span>{formatPrice(selectedOrder.total_gross)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
