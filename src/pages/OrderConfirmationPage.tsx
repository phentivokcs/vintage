import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, Truck, FileText, Loader2 } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          billing_address:addresses!orders_billing_address_id_fkey(*),
          shipping_address:addresses!orders_shipping_address_id_fkey(*),
          order_items(
            *,
            variant:variants(
              *,
              product:products(
                *,
                brand:brands(*),
                product_images(*)
              )
            )
          ),
          payments(*),
          shipments(*)
        `)
        .eq('id', orderId)
        .single();

      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billingo-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ orderId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Számla sikeresen kiállítva! Számlaszám: ${data.invoiceNumber}`);
        loadOrder();
      } else {
        alert('Hiba történt a számla kiállítása során.');
      }
    } catch (error) {
      console.error('Invoice error:', error);
      alert('Hiba történt a számla kiállítása során.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const statusLabels: Record<string, string> = {
    pending: 'Függőben',
    paid: 'Fizetve',
    processing: 'Feldolgozás alatt',
    shipped: 'Szállítás alatt',
    delivered: 'Kézbesítve',
    cancelled: 'Törölve',
    refunded: 'Visszatérítve',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rendelés nem található</h2>
          <a href="/" className="text-gray-600 hover:text-gray-900">
            Vissza a főoldalra
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-vintage-cream-light rounded-lg shadow-sm p-8 mb-6">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Köszönjük a rendelésed!</h1>
            <p className="text-gray-600">
              Rendelésszám: <span className="font-semibold">{order.id}</span>
            </p>
            <p className="text-gray-600">
              Állapot:{' '}
              <span className="font-semibold">{statusLabels[order.status] || order.status}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Fizetés</p>
              <p className="text-sm text-gray-600">
                {order.payment_status === 'paid' ? 'Sikeres' : 'Folyamatban'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Truck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Szállítás</p>
              <p className="text-sm text-gray-600">
                {order.shipments?.[0]?.status === 'delivered'
                  ? 'Kézbesítve'
                  : order.shipments?.[0]?.status === 'shipped'
                  ? 'Úton'
                  : 'Előkészítés'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Számla</p>
              <p className="text-sm text-gray-600">
                {order.invoice_number ? order.invoice_number : 'Még nem készült el'}
              </p>
            </div>
          </div>

          {order.payment_status === 'paid' && !order.invoice_number && (
            <div className="mb-8 text-center">
              <button
                onClick={generateInvoice}
                disabled={invoiceLoading}
                className="px-6 py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors disabled:opacity-50"
              >
                {invoiceLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                    Számla kiállítása...
                  </>
                ) : (
                  'Számla kiállítása'
                )}
              </button>
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rendelt termékek</h2>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img
                    src={item.variant?.product?.product_images?.[0]?.url}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.variant?.product?.brand?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.sku} • Mennyiség: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(item.unit_price_gross * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t mt-6 pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Részösszeg</span>
                <span>{formatPrice(order.total_net)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ÁFA (27%)</span>
                <span>{formatPrice(order.total_vat)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Szállítás</span>
                <span>{formatPrice(order.shipping_fee_gross)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t">
                <span>Összesen</span>
                <span>{formatPrice(order.total_gross)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-vintage-cream-light rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3">Szállítási cím</h3>
            <div className="text-gray-600 space-y-1">
              <p>{order.shipping_address?.street}</p>
              {order.shipping_address?.floor_door && <p>{order.shipping_address.floor_door}</p>}
              <p>
                {order.shipping_address?.zip_code} {order.shipping_address?.city}
              </p>
              <p>{order.shipping_address?.country}</p>
            </div>
          </div>

          <div className="bg-vintage-cream-light rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3">Számlázási cím</h3>
            <div className="text-gray-600 space-y-1">
              <p>{order.billing_address?.street}</p>
              {order.billing_address?.floor_door && <p>{order.billing_address.floor_door}</p>}
              <p>
                {order.billing_address?.zip_code} {order.billing_address?.city}
              </p>
              <p>{order.billing_address?.country}</p>
            </div>
          </div>
        </div>

        {order.shipments?.[0]?.tracking_number && (
          <div className="mt-6 bg-vintage-cream-light rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3">Csomag követése</h3>
            <p className="text-gray-600 mb-3">
              Követési szám:{' '}
              <span className="font-semibold">{order.shipments[0].tracking_number}</span>
            </p>
            <a
              href={`https://tracking.packeta.com/hu/?id=${order.shipments[0].tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors"
            >
              Csomag nyomon követése
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
