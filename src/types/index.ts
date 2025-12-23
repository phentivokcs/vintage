export interface Product {
  id: string;
  title: string;
  slug: string;
  brand?: Brand;
  category?: Category;
  description?: string;
  condition?: 'mint' | 'like_new' | 'excellent' | 'good' | 'fair';
  condition_description?: string;
  gender?: 'male' | 'female' | 'unisex';
  season?: string;
  original_price_gross?: number;
  published: boolean;
  images: ProductImage[];
  variants: Variant[];
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  price_gross: number;
  price_net: number;
  vat_rate: number;
  currency: string;
  attributes?: Record<string, any>;
  is_unique_piece: boolean;
  inventory?: Inventory;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  width?: number;
  height?: number;
  sort_order: number;
  is_cover: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  sort_order: number;
}

export interface Inventory {
  id: string;
  variant_id: string;
  quantity_available: number;
  location?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant: Variant;
  product: Product;
  quantity: number;
  price_snapshot: number;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title: string;
  comment?: string;
  verified_purchase: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    name?: string;
  };
}

export interface ReviewHelpful {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}
