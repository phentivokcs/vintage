import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface CheckoutForm {
  email: string;
  fullName: string;
  phone: string;
  country: string;
  zipCode: string;
  city: string;
  street: string;
  floorDoor: string;
  shippingMethod: 'packeta' | 'foxpost' | 'home' | 'dpd';
  pickupPointId?: string;
  billingAddressSame: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [form, setForm] = useState<CheckoutForm>({
    email: '',
    fullName: '',
    phone: '',
    country: 'HU',
    zipCode: '',
    city: '',
    street: '',
    floorDoor: '',
    shippingMethod: 'packeta',
    billingAddressSame: true,
  });

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (form.shippingMethod === 'packeta') {
      loadPickupPoints();
    }
  }, [form.shippingMethod]);

  const loadCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/bejelentkezes');
      return;
    }

    const { data: cart } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items(
          *,
          variant:variants(
            *,
            product:products(
              *,
              brand:brands(*),
              product_images(*)
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (cart?.cart_items) {
      setCartItems(cart.cart_items);
    }

    if (user.email) {
      setForm(prev => ({ ...prev, email: user.email! }));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userData && useProfileAddress) {
      setForm(prev => ({
        ...prev,
        fullName: userData.name || prev.fullName,
        phone: userData.phone || prev.phone,
        zipCode: userData.zip || prev.zipCode,
        city: userData.city || prev.city,
        street: userData.address || prev.street,
      }));
    }
  };

  const loadPickupPoints = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/packeta-shipping/pickup-points?country=HU&carrier=packeta`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPickupPoints(data.pickupPoints.slice(0, 20));
      }
    } catch (error) {
      console.error('Failed to load pickup points:', error);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
    const shippingFee = form.shippingMethod === 'home' ? 1500 : form.shippingMethod === 'dpd' ? 1200 : 990;
    const subtotal = itemsTotal + shippingFee;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = (subtotal * appliedCoupon.discount_value) / 100;
        if (appliedCoupon.max_discount) {
          discount = Math.min(discount, appliedCoupon.max_discount);
        }
      } else {
        discount = appliedCoupon.discount_value;
      }
      discount = Math.min(discount, subtotal);
    }

    return {
      itemsTotal,
      shippingFee,
      discount: Math.round(discount),
      total: Math.round(subtotal - discount)
    };
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Adj meg egy kuponkódot');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coupon, error: couponFetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponFetchError || !coupon) {
        setCouponError('Érvénytelen kuponkód');
        return;
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setCouponError('Lejárt kuponkód');
        return;
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        setCouponError('Elfogyott a kupon');
        return;
      }

      const { data: userUsage } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id);

      if (userUsage && coupon.per_user_limit && userUsage.length >= coupon.per_user_limit) {
        setCouponError('Már felhasználtad ezt a kupont');
        return;
      }

      const { itemsTotal, shippingFee } = calculateTotal();
      const orderTotal = itemsTotal + shippingFee;

      if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
        setCouponError(`Minimum rendelési érték: ${formatPrice(coupon.min_order_value)}`);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError('');
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponError('Hiba történt a kupon ellenőrzése során');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/bejelentkezes');
        return;
      }

      const { itemsTotal, shippingFee, discount, total } = calculateTotal();
      const vatRate = 27;
      const totalNet = total / (1 + vatRate / 100);
      const totalVat = total - totalNet;

      const { data: billingAddress, error: billingError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          type: 'billing',
          country: form.country,
          zip_code: form.zipCode,
          city: form.city,
          street: form.street,
          floor_door: form.floorDoor,
          phone: form.phone,
        })
        .select()
        .single();

      if (billingError) {
        console.error('Billing address error:', billingError);
        throw new Error('Számlázási cím létrehozása sikertelen: ' + billingError.message);
      }

      const { data: shippingAddress, error: shippingError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          type: 'shipping',
          country: form.country,
          zip_code: form.zipCode,
          city: form.city,
          street: form.street,
          floor_door: form.floorDoor,
          phone: form.phone,
        })
        .select()
        .single();

      if (shippingError) {
        console.error('Shipping address error:', shippingError);
        throw new Error('Szállítási cím létrehozása sikertelen: ' + shippingError.message);
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          email: form.email,
          full_name: form.fullName,
          order_number: orderNumber,
          status: 'pending',
          total_net: totalNet,
          total_vat: totalVat,
          total_gross: total,
          currency: 'HUF',
          shipping_method: form.shippingMethod,
          shipping_fee_gross: shippingFee,
          billing_address_id: billingAddress?.id,
          shipping_address_id: shippingAddress?.id,
          coupon_id: appliedCoupon?.id,
          discount_amount: discount,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        throw new Error('Megrendelés létrehozása sikertelen: ' + (orderError?.message || 'Ismeretlen hiba'));
      }

      for (const item of cartItems) {
        const { error: itemError } = await supabase.from('order_items').insert({
          order_id: order.id,
          variant_id: item.variant_id,
          sku: item.variant.sku,
          title: item.variant.product.title,
          attributes: item.variant.attributes,
          quantity: item.quantity,
          unit_price_gross: item.price_snapshot,
          vat_rate: item.variant.vat_rate,
        });

        if (itemError) {
          console.error('Order item error:', itemError);
          throw new Error('Megrendelési tétel létrehozása sikertelen: ' + itemError.message);
        }
      }

      if (appliedCoupon) {
        await supabase.from('coupon_usage').insert({
          coupon_id: appliedCoupon.id,
          user_id: user.id,
          order_id: order.id,
          discount_amount: discount,
        });

        await supabase
          .from('coupons')
          .update({ usage_count: appliedCoupon.usage_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      const { data: { session } } = await supabase.auth.getSession();

      const paymentItems = cartItems.map(item => ({
        name: item.variant.product.title,
        description: `${item.variant.product.brand?.name || ''} - ${item.variant.sku}`,
        quantity: item.quantity,
        unit: 'db',
        unitPrice: item.price_snapshot,
        itemTotal: item.price_snapshot * item.quantity,
        sku: item.variant.sku,
      }));

      paymentItems.push({
        name: 'Szállítási költség',
        description: form.shippingMethod === 'home' ? 'Házhozszállítás' : 'Csomagpont',
        quantity: 1,
        unit: 'db',
        unitPrice: shippingFee,
        itemTotal: shippingFee,
        sku: 'SHIPPING',
      });

      const useMockPayment = true;

      if (useMockPayment) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            order_id: order.id,
            provider: 'mock',
            amount: total,
            currency: 'HUF',
            status: 'completed',
            provider_reference: `MOCK-${Date.now()}`,
          });

        if (paymentError) {
          console.error('Mock payment error:', paymentError);
        }

        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);

        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-confirmation`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderId: order.id }),
            }
          );
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        navigate(`/rendeles/${order.id}/megerosites`);
      } else {
        const paymentResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/barion-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              orderId: order.id,
              amount: total,
              currency: 'HUF',
              payerEmail: form.email,
              items: paymentItems,
            }),
          }
        );

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error('Payment response error:', errorText);
          throw new Error('Fizetési szolgáltatás hiba: ' + paymentResponse.statusText);
        }

        const paymentData = await paymentResponse.json();
        console.log('Payment data:', paymentData);

        if (paymentData.success && paymentData.gatewayUrl) {
          window.location.href = paymentData.gatewayUrl;
        } else {
          console.error('Payment data error:', paymentData);
          throw new Error('Fizetés indítása sikertelen: ' + (paymentData.error || 'Ismeretlen hiba'));
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Hiba történt: ' + (error.message || 'Kérjük, próbáld újra!'));
    } finally {
      setLoading(false);
    }
  };

  const { itemsTotal, shippingFee, total } = calculateTotal();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Üres a kosarad</h2>
          <p className="text-gray-600 mb-6">Add hozzá a kívánt termékeket a kosárhoz!</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors"
          >
            Vissza a vásárláshoz
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pénztár</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-vintage-cream-light rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kapcsolattartási adatok</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail cím *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teljes név *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      disabled={useProfileAddress}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefonszám *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+36 30 123 4567"
                      disabled={useProfileAddress}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Szállítási cím</h2>
                  <div className="flex items-center gap-4">
                    {!useProfileAddress && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseProfileAddress(true);
                          loadCart();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Profil cím használata
                      </button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useProfileAddress}
                        onChange={(e) => {
                          setUseProfileAddress(e.target.checked);
                          if (!e.target.checked) {
                            setForm(prev => ({
                              ...prev,
                              fullName: '',
                              phone: '',
                              zipCode: '',
                              city: '',
                              street: '',
                              floorDoor: '',
                            }));
                          } else {
                            loadCart();
                          }
                        }}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">Profil adatok használata</span>
                    </label>
                  </div>
                </div>

                {useProfileAddress && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUseProfileAddress(false);
                        setForm(prev => ({
                          ...prev,
                          fullName: '',
                          phone: '',
                          zipCode: '',
                          city: '',
                          street: '',
                          floorDoor: '',
                        }));
                      }}
                      className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Másik címre szeretném
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Irányítószám *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.zipCode}
                        onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                        placeholder="1234"
                        disabled={useProfileAddress}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Város *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        disabled={useProfileAddress}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Utca, házszám *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      placeholder="Példa utca 12"
                      disabled={useProfileAddress}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emelet, ajtó
                    </label>
                    <input
                      type="text"
                      value={form.floorDoor}
                      onChange={(e) => setForm({ ...form, floorDoor: e.target.value })}
                      placeholder="2. em. 5."
                      disabled={useProfileAddress}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Szállítási mód</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="shipping"
                      value="packeta"
                      checked={form.shippingMethod === 'packeta'}
                      onChange={(e) => setForm({ ...form, shippingMethod: e.target.value as any })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Packeta csomagpont</div>
                      <div className="text-sm text-gray-600">1-2 munkanap</div>
                    </div>
                    <div className="font-bold">{formatPrice(990)}</div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="shipping"
                      value="foxpost"
                      checked={form.shippingMethod === 'foxpost'}
                      onChange={(e) => setForm({ ...form, shippingMethod: e.target.value as any })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Foxpost csomagpont</div>
                      <div className="text-sm text-gray-600">1-2 munkanap</div>
                    </div>
                    <div className="font-bold">{formatPrice(990)}</div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="shipping"
                      value="dpd"
                      checked={form.shippingMethod === 'dpd'}
                      onChange={(e) => setForm({ ...form, shippingMethod: e.target.value as any })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">DPD házhozszállítás</div>
                      <div className="text-sm text-gray-600">1-2 munkanap</div>
                    </div>
                    <div className="font-bold">{formatPrice(1200)}</div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="shipping"
                      value="home"
                      checked={form.shippingMethod === 'home'}
                      onChange={(e) => setForm({ ...form, shippingMethod: e.target.value as any })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Házhozszállítás (standard)</div>
                      <div className="text-sm text-gray-600">2-3 munkanap</div>
                    </div>
                    <div className="font-bold">{formatPrice(1500)}</div>
                  </label>
                </div>

                {form.shippingMethod === 'packeta' && pickupPoints.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Válassz csomagpontot *
                    </label>
                    <select
                      required
                      value={form.pickupPointId}
                      onChange={(e) => setForm({ ...form, pickupPointId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="">Válassz...</option>
                      {pickupPoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} - {point.street}, {point.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-vintage-red text-white font-bold rounded-lg hover:bg-vintage-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Feldolgozás...
                  </>
                ) : (
                  'Fizetés'
                )}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-vintage-cream-light rounded-lg shadow-sm p-6 sticky top-24">
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Biztonságos fizetés</h3>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <img
                      src="/barion-smart-banner-light.svg"
                      alt="Barion"
                      className="h-5"
                    />
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2">
                    <svg className="h-7" viewBox="0 0 131.39 86.9" xmlns="http://www.w3.org/2000/svg">
                      <rect fill="#ff5f00" height="57.5" rx="8.77" width="34.6" x="48.37" y="14.7"/>
                      <path d="M51.94 43.45a36.5 36.5 0 0114-28.75 36.58 36.58 0 100 57.5 36.5 36.5 0 01-14-28.75z" fill="#eb001b"/>
                      <path d="M125.1 43.45a36.58 36.58 0 01-59.16 28.75 36.58 36.58 0 000-57.5 36.58 36.58 0 0159.16 28.75z" fill="#f79e1b"/>
                    </svg>
                    <svg className="h-5" viewBox="0 0 192 60" xmlns="http://www.w3.org/2000/svg">
                      <path d="M93.2 17.5L78.4 42.5h9.2L102.4 17.5h-9.2zm-18 0L60.4 42.5h9.2L84.4 17.5h-9.2z" fill="#1a1f71"/>
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Összesítő</h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.variant.product.product_images?.[0]?.url}
                      alt={item.variant.product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.variant.product.title}</p>
                      <p className="text-sm text-gray-600">Mennyiség: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatPrice(item.price_snapshot * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kuponkód
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="KUPONKÓD"
                        disabled={!!appliedCoupon}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 uppercase"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Törlés
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={validateCoupon}
                          disabled={couponLoading}
                          className="px-4 py-2 bg-vintage-red text-white rounded-lg hover:bg-vintage-red/90 disabled:opacity-50"
                        >
                          {couponLoading ? 'Ellenőrzés...' : 'Alkalmaz'}
                        </button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 mt-1">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className="text-sm text-green-600 mt-1 font-medium">
                        ✓ Kupon alkalmazva: {appliedCoupon.code}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Részösszeg</span>
                    <span>{formatPrice(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Szállítás</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  {calculateTotal().discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Kedvezmény</span>
                      <span>-{formatPrice(calculateTotal().discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Összesen</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
