import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCart();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadCart();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCartItems([]);
        setCartCount(0);
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
        window.location.href = '/bejelentkezes';
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
      } else {
        await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
        await loadCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
