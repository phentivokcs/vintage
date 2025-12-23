import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          title: string;
          slug: string;
          brand_id: string | null;
          category_id: string;
          description: string | null;
          condition: string | null;
          gender: string | null;
          season: string | null;
          original_price_gross: number | null;
          published: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          price_gross: number;
          price_net: number;
          vat_rate: number;
          currency: string;
          weight_g: number | null;
          attributes: Record<string, any> | null;
          is_unique_piece: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          width: number | null;
          height: number | null;
          sort_order: number;
          background_removed: boolean;
          is_cover: boolean;
          created_at: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          variant_id: string;
          quantity_available: number;
          location: string | null;
          updated_at: string;
        };
      };
    };
  };
};
