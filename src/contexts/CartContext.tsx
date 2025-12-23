import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
  price_snapshot: number;
  variant?: any;
}

interface LocalCartItem {
  variantId: string;
  quantity: number;
  price: number;
}

interface CartContextType {
  cartItems: any[];
  cartCount: number;
  addToCart: (variantId: string, quantity: number, price: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'guest_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCart();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await migrateGuestCart();
      }
      await loadCart();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const migrateGuestCart = async () => {
    try {
      const guestCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!guestCart) return;

      const guestItems: LocalCartItem[] = JSON.parse(guestCart);
      if (guestItems.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select()
          .single();
        cart = newCart;
      }

      if (cart) {
        for (const item of guestItems) {
          const { data: existingItem } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', cart.id)
            .eq('variant_id', item.variantId)
            .maybeSingle();

          if (existingItem) {
            await supabase
              .from('cart_items')
              .update({ quantity: existingItem.quantity + item.quantity })
              .eq('id', existingItem.id);
          } else {
            await supabase
              .from('cart_items')
              .insert({
                cart_id: cart.id,
                variant_id: item.variantId,
                quantity: item.quantity,
                price_snapshot: item.price,
              });
          }
        }
      }

      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  };

  const loadLocalCart = async () => {
    try {
      const guestCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!guestCart) {
        setCartItems([]);
        setCartCount(0);
        return;
      }

      const localItems: LocalCartItem[] = JSON.parse(guestCart);

      const itemsWithDetails = await Promise.all(
        localItems.map(async (item) => {
          const { data: variant } = await supabase
            .from('variants')
            .select(`
              *,
              product:products(
                *,
                brand:brands(*),
                product_images(*)
              )
            `)
            .eq('id', item.variantId)
            .maybeSingle();

          return {
            id: `local-${item.variantId}`,
            variant_id: item.variantId,
            quantity: item.quantity,
            price_snapshot: item.price,
            variant,
          };
        })
      );

      setCartItems(itemsWithDetails);
      setCartCount(localItems.reduce((sum, item) => sum + item.quantity, 0));
    } catch (error) {
      console.error('Error loading local cart:', error);
    }
  };

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        await loadLocalCart();
        return;
      }

      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select()
          .single();
        cart = newCart;
      }

      if (cart) {
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            *,
            variant:variants(
              *,
              product:products(
                *,
                brand:brands(*),
                product_images(*)
              )
            )
          `)
          .eq('cart_id', cart.id);

        setCartItems(items || []);
        setCartCount(items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (variantId: string, quantity: number, price: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const guestCart = localStorage.getItem(CART_STORAGE_KEY);
        const localItems: LocalCartItem[] = guestCart ? JSON.parse(guestCart) : [];

        const existingIndex = localItems.findIndex(item => item.variantId === variantId);

        if (existingIndex >= 0) {
          localItems[existingIndex].quantity += quantity;
        } else {
          localItems.push({ variantId, quantity, price });
        }

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItems));
        await loadLocalCart();
        return;
      }

      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cartError) {
        console.error('Error loading cart:', cartError);
        throw cartError;
      }

      if (!cart) {
        const { data: newCart, error: insertError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating cart:', insertError);
          throw insertError;
        }
        cart = newCart;
      }

      if (cart) {
        const { data: existingItem, error: itemError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id)
          .eq('variant_id', variantId)
          .maybeSingle();

        if (itemError) {
          console.error('Error checking existing item:', itemError);
          throw itemError;
        }

        if (existingItem) {
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);

          if (updateError) {
            console.error('Error updating cart item:', updateError);
            throw updateError;
          }
        } else {
          const { error: insertItemError } = await supabase
            .from('cart_items')
            .insert({
              cart_id: cart.id,
              variant_id: variantId,
              quantity: quantity,
              price_snapshot: price,
            });

          if (insertItemError) {
            console.error('Error inserting cart item:', insertItemError);
            throw insertItemError;
          }
        }

        await loadCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (itemId.startsWith('local-')) {
          const variantId = itemId.replace('local-', '');
          const guestCart = localStorage.getItem(CART_STORAGE_KEY);
          if (guestCart) {
            const localItems: LocalCartItem[] = JSON.parse(guestCart);
            const updatedItems = localItems.filter(item => item.variantId !== variantId);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
            await loadLocalCart();
          }
        }
        return;
      }

      await supabase.from('cart_items').delete().eq('id', itemId);
      await loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (itemId.startsWith('local-')) {
          const variantId = itemId.replace('local-', '');
          const guestCart = localStorage.getItem(CART_STORAGE_KEY);
          if (guestCart) {
            const localItems: LocalCartItem[] = JSON.parse(guestCart);
            const itemIndex = localItems.findIndex(item => item.variantId === variantId);
            if (itemIndex >= 0) {
              localItems[itemIndex].quantity = quantity;
              localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItems));
              await loadLocalCart();
            }
          }
        }
        return;
      }

      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);
      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        localStorage.removeItem(CART_STORAGE_KEY);
        await loadLocalCart();
        return;
      }

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cart) {
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
        await loadCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
