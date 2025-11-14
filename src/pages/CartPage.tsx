import { useCart } from '../contexts/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_snapshot * item.quantity,
    0
  );

  const shippingFee = subtotal >= 15000 ? 0 : 990;
  const total = subtotal + shippingFee;

  if (cartItems.length === 0) {
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
            Tovább vásárolok
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Kosár</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-vintage-cream-light rounded-lg shadow-sm p-6 flex gap-6"
              >
                <img
                  src={item.variant?.product?.product_images?.[0]?.url}
                  alt={item.variant?.product?.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.variant?.product?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.variant?.product?.brand?.name}
                      </p>
                      {item.variant?.attributes?.size && (
                        <p className="text-sm text-gray-600">
                          Méret: {item.variant.attributes.size}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatPrice(item.price_snapshot * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 rounded-lg border border-gray-300 hover:border-gray-900 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 rounded-lg border border-gray-300 hover:border-gray-900 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-vintage-cream-light rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Összesítő</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Részösszeg</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Szállítás</span>
                  <span>{shippingFee === 0 ? 'Ingyenes' : formatPrice(shippingFee)}</span>
                </div>
                {subtotal < 15000 && (
                  <p className="text-sm text-gray-600">
                    Még {formatPrice(15000 - subtotal)} és ingyenes a szállítás!
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Összesen</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <a
                href="/penztar"
                className="block w-full py-4 bg-vintage-red text-white font-bold rounded-lg hover:bg-vintage-red/90 transition-colors text-center"
              >
                Tovább a fizetéshez
              </a>

              <a
                href="/"
                className="block w-full py-3 text-center text-gray-600 hover:text-gray-900 font-medium mt-3"
              >
                Tovább vásárolok
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
