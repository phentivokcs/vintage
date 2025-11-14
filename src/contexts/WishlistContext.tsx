import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface WishlistContextType {
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  loadWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    loadWishlist();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadWishlist();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setWishlistItems([]);
        return;
      }

      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      setWishlistItems(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/bejelentkezes';
        return;
      }

      if (isInWishlist(productId)) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        setWishlistItems(prev => prev.filter(id => id !== productId));
      } else {
        await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        setWishlistItems(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
