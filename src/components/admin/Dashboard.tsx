import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Package, ShoppingBag, DollarSign, Users } from 'lucide-react';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: Array<{
    id: string;
    created_at: string;
    total_gross: number;
    status: string;
    users?: { email: string };
  }>;
  topProducts: Array<{
    product_id: string;
    total_quantity: number;
    total_revenue: number;
    products: {
      title: string;
    };
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const { data: orders } = await supabase
      .from('orders')
      .select('total_gross, status, created_at, users(email), id')
      .order('created_at', { ascending: false });

    const { data: products } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    const { data: topProductsData } = await supabase
      .from('order_items')
      .select(`
        variant_id,
        quantity,
        unit_price_gross,
        variants!inner(
          product_id,
          products!inner(
            title
          )
        )
      `);

    const productStats = new Map<string, { quantity: number; revenue: number; title: string }>();
    topProductsData?.forEach((item: any) => {
      const productId = item.variants.product_id;
      const title = item.variants.products.title;
      const existing = productStats.get(productId) || { quantity: 0, revenue: 0, title };
      productStats.set(productId, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.unit_price_gross * item.quantity),
        title,
      });
    });

    const topProducts = Array.from(productStats.entries())
      .map(([product_id, data]) => ({
        product_id,
        total_quantity: data.quantity,
        total_revenue: data.revenue,
        products: { title: data.title },
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 5);

    const totalRevenue = orders?.reduce((sum, order) => {
      if (order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
        return sum + order.total_gross;
      }
      return sum;
    }, 0) || 0;

    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    setStats({
      totalRevenue,
      totalOrders: orders?.length || 0,
      totalProducts: products?.length || 0,
      pendingOrders,
      recentOrders: orders?.slice(0, 5) || [],
      topProducts,
    });

    setLoading(false);
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
      month: 'short',
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
      processing: 'Feldolgozás',
      shipped: 'Szállítás',
      delivered: 'Kézbesítve',
      cancelled: 'Törölve',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Áttekintés</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-blue-100 text-sm font-medium">Teljes bevétel</p>
          <p className="text-3xl font-bold mt-2">{formatPrice(stats.totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-green-100 text-sm font-medium">Összes rendelés</p>
          <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm font-medium">Összes termék</p>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-orange-100 text-sm font-medium">Függőben lévő</p>
          <p className="text-3xl font-bold mt-2">{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-vintage-cream-light rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Legutóbbi rendelések</h3>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincs rendelés</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.users?.email || 'Vendég'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(order.total_gross)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-vintage-cream-light rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Legnépszerűbb termékek</h3>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincs adat</p>
            ) : (
              stats.topProducts.map((product) => (
                <div key={product.product_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.products.title}
                    </p>
                    <p className="text-xs text-gray-500">{product.total_quantity} db eladva</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrice(product.total_revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
