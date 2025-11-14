import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    bannerImage?: string;
  };
  promo: {
    banner1: { title: string; link: string; active: boolean; image?: string };
    banner2: { title: string; link: string; active: boolean; image?: string };
    banner3: { title: string; link: string; active: boolean; image?: string };
  };
  category: {
    men: { title: string; description: string; headerImage?: string };
    women: { title: string; description: string; headerImage?: string };
    tops: { title: string; description: string; image?: string; link: string };
    accessories: { title: string; description: string; image?: string; link: string };
    shoes: { title: string; description: string; image?: string; link: string };
  };
  footer: {
    shopName: string;
    shopDescription: string;
    email: string;
    phone: string;
    address: string;
    facebookUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
    aboutText: string;
    copyright: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
  };
  newsletter: {
    title: string;
    description: string;
    buttonText: string;
    placeholder: string;
    successMessage: string;
    privacyText: string;
  };
  design: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    successColor: string;
    errorColor: string;
    logo?: string;
  };
}

interface SiteAssets {
  size_guide_tops?: { public_url: string };
  size_guide_pants?: { public_url: string };
  [key: string]: { public_url: string } | undefined;
}

interface SiteContentContextType {
  content: SiteContent;
  assets: SiteAssets;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultContent: SiteContent = {
  hero: {
    title: 'Fenntartható Divat, Egyedi Stílus',
    subtitle: 'Fedezd fel gondosan válogatott használt ruháinkat.',
    ctaText: 'Böngészés',
    ctaLink: '/products',
  },
  promo: {
    banner1: { title: 'Új Érkezések', link: '/products?sort=newest', active: true },
    banner2: { title: 'Exkluzív Márkák', link: '/products?brands=premium', active: true },
    banner3: { title: 'Sale', link: '/products?sale=true', active: false },
  },
  category: {
    men: { title: 'Férfi Ruházat', description: 'Prémium minőségű használt férfi ruházat' },
    women: { title: 'Női Ruházat', description: 'Egyedi női ruhák és kiegészítők' },
    tops: { title: 'Felsők', description: 'Pólók, ingek, pulóverek', link: '/kategoria/felsok' },
    accessories: { title: 'Kiegészítők', description: 'Órák, táskák, kiegészítők', link: '/kategoria/kiegeszitok' },
    shoes: { title: 'Cipők & Táskák', description: 'Sneakerek, táskák', link: '/kategoria/cipok-taskak' },
  },
  footer: {
    shopName: 'Vintage Vibes',
    shopDescription: 'Magyarország vezető használt ruha webshopja.',
    email: 'info@vintagevibes.hu',
    phone: '+36 30 123 4567',
    address: '8446 Kislőd, Bocskay utca 14.',
    facebookUrl: 'https://facebook.com/vintagevibes',
    instagramUrl: 'https://instagram.com/vintagevibes',
    tiktokUrl: '',
    aboutText: 'A Vintage Vibes 2020-ban indult a fenntartható divat jegyében.',
    copyright: '© 2025 Vintage Vibes. Minden jog fenntartva.',
  },
  seo: {
    metaTitle: 'Vintage Vibes - Használt Ruha Webshop',
    metaDescription: 'Prémium minőségű használt ruhák, cipők és kiegészítők.',
    metaKeywords: 'használt ruha, vintage, second hand',
    ogTitle: 'Vintage Vibes - Fenntartható Használt Ruha',
    ogDescription: 'Fedezd fel egyedi használt ruha kollekcióinkat!',
  },
  newsletter: {
    title: 'Iratkozz fel hírlevelünkre',
    description: 'Legyél az első, aki értesül az új termékekről!',
    buttonText: 'Feliratkozás',
    placeholder: 'Add meg az email címed',
    successMessage: 'Köszönjük! Hamarosan küldünk egy megerősítő emailt.',
    privacyText: 'Az adataidat bizalmasan kezeljük.',
  },
  design: {
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    successColor: '#10b981',
    errorColor: '#ef4444',
  },
};

const SiteContentContext = createContext<SiteContentContextType>({
  content: defaultContent,
  assets: {},
  loading: true,
  refresh: async () => {},
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [assets, setAssets] = useState<SiteAssets>({});
  const [loading, setLoading] = useState(true);

  const parseValue = (value: any, contentType: string): any => {
    if (contentType === 'json' && value?.hu) {
      return value.hu;
    }
    if (contentType === 'boolean' && value?.value !== undefined) {
      return value.value;
    }
    if (contentType === 'color' && value?.value) {
      return value.value;
    }
    if (contentType === 'url' && value?.value !== undefined) {
      return value.value;
    }
    if (contentType === 'text' && value?.value !== undefined) {
      return value.value;
    }
    return value;
  };

  const loadContent = async () => {
    try {
      const cachedContent = localStorage.getItem('site_content');
      const cachedAssets = localStorage.getItem('site_assets');
      const cacheTimestamp = localStorage.getItem('site_content_timestamp');
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000;

      if (cachedContent && cachedAssets && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        setContent(JSON.parse(cachedContent));
        setAssets(JSON.parse(cachedAssets));
        setLoading(false);
        return;
      }

      const [contentData, assetsData] = await Promise.all([
        supabase.from('site_content').select('*'),
        supabase.from('site_assets').select('*'),
      ]);

      if (contentData.error || assetsData.error) {
        console.error('Error loading site content:', contentData.error || assetsData.error);
        setContent(defaultContent);
        setLoading(false);
        return;
      }

      const assetsMap = new Map(
        assetsData.data?.map(asset => [asset.asset_key, asset.public_url]) || []
      );

      const newContent: SiteContent = { ...defaultContent };

      contentData.data?.forEach((item: any) => {
        const value = parseValue(item.value, item.content_type);

        switch (item.section) {
          case 'hero':
            if (item.key === 'title') newContent.hero.title = value;
            if (item.key === 'subtitle') newContent.hero.subtitle = value;
            if (item.key === 'cta_text') newContent.hero.ctaText = value;
            if (item.key === 'cta_link') newContent.hero.ctaLink = value;
            break;
          case 'promo':
            if (item.key === 'banner_1_title') newContent.promo.banner1.title = value;
            if (item.key === 'banner_1_link') newContent.promo.banner1.link = value;
            if (item.key === 'banner_1_active') newContent.promo.banner1.active = value;
            if (item.key === 'banner_2_title') newContent.promo.banner2.title = value;
            if (item.key === 'banner_2_link') newContent.promo.banner2.link = value;
            if (item.key === 'banner_2_active') newContent.promo.banner2.active = value;
            if (item.key === 'banner_3_title') newContent.promo.banner3.title = value;
            if (item.key === 'banner_3_link') newContent.promo.banner3.link = value;
            if (item.key === 'banner_3_active') newContent.promo.banner3.active = value;
            break;
          case 'category':
            if (item.key === 'men_title') newContent.category.men.title = value;
            if (item.key === 'men_description') newContent.category.men.description = value;
            if (item.key === 'women_title') newContent.category.women.title = value;
            if (item.key === 'women_description') newContent.category.women.description = value;
            if (item.key === 'tops_title') newContent.category.tops.title = value;
            if (item.key === 'tops_description') newContent.category.tops.description = value;
            if (item.key === 'tops_link') newContent.category.tops.link = value;
            if (item.key === 'accessories_title') newContent.category.accessories.title = value;
            if (item.key === 'accessories_description') newContent.category.accessories.description = value;
            if (item.key === 'accessories_link') newContent.category.accessories.link = value;
            if (item.key === 'shoes_title') newContent.category.shoes.title = value;
            if (item.key === 'shoes_description') newContent.category.shoes.description = value;
            if (item.key === 'shoes_link') newContent.category.shoes.link = value;
            break;
          case 'footer':
            if (item.key === 'shop_name') newContent.footer.shopName = value;
            if (item.key === 'shop_description') newContent.footer.shopDescription = value;
            if (item.key === 'email') newContent.footer.email = value;
            if (item.key === 'phone') newContent.footer.phone = value;
            if (item.key === 'address') newContent.footer.address = value;
            if (item.key === 'facebook_url') newContent.footer.facebookUrl = value;
            if (item.key === 'instagram_url') newContent.footer.instagramUrl = value;
            if (item.key === 'tiktok_url') newContent.footer.tiktokUrl = value;
            if (item.key === 'about_text') newContent.footer.aboutText = value;
            if (item.key === 'copyright') newContent.footer.copyright = value;
            break;
          case 'seo':
            if (item.key === 'meta_title') newContent.seo.metaTitle = value;
            if (item.key === 'meta_description') newContent.seo.metaDescription = value;
            if (item.key === 'meta_keywords') newContent.seo.metaKeywords = value;
            if (item.key === 'og_title') newContent.seo.ogTitle = value;
            if (item.key === 'og_description') newContent.seo.ogDescription = value;
            break;
          case 'newsletter':
            if (item.key === 'title') newContent.newsletter.title = value;
            if (item.key === 'description') newContent.newsletter.description = value;
            if (item.key === 'button_text') newContent.newsletter.buttonText = value;
            if (item.key === 'placeholder') newContent.newsletter.placeholder = value;
            if (item.key === 'success_message') newContent.newsletter.successMessage = value;
            if (item.key === 'privacy_text') newContent.newsletter.privacyText = value;
            break;
          case 'design':
            if (item.key === 'primary_color') newContent.design.primaryColor = value;
            if (item.key === 'secondary_color') newContent.design.secondaryColor = value;
            if (item.key === 'accent_color') newContent.design.accentColor = value;
            if (item.key === 'success_color') newContent.design.successColor = value;
            if (item.key === 'error_color') newContent.design.errorColor = value;
            break;
        }
      });

      newContent.hero.bannerImage = assetsMap.get('hero_banner');
      newContent.promo.banner1.image = assetsMap.get('promo_1');
      newContent.promo.banner2.image = assetsMap.get('promo_2');
      newContent.promo.banner3.image = assetsMap.get('promo_3');
      newContent.category.men.headerImage = assetsMap.get('category_men');
      newContent.category.women.headerImage = assetsMap.get('category_women');
      newContent.category.tops.image = assetsMap.get('category_tops');
      newContent.category.accessories.image = assetsMap.get('category_accessories');
      newContent.category.shoes.image = assetsMap.get('category_shoes');
      newContent.seo.ogImage = assetsMap.get('og_image');
      newContent.design.logo = assetsMap.get('logo');

      const newAssets: SiteAssets = {};
      const sizeGuideTopsUrl = assetsMap.get('size_guide_tops');
      const sizeGuidePantsUrl = assetsMap.get('size_guide_pants');
      if (sizeGuideTopsUrl) newAssets.size_guide_tops = { public_url: sizeGuideTopsUrl };
      if (sizeGuidePantsUrl) newAssets.size_guide_pants = { public_url: sizeGuidePantsUrl };

      setContent(newContent);
      setAssets(newAssets);
      localStorage.setItem('site_content', JSON.stringify(newContent));
      localStorage.setItem('site_assets', JSON.stringify(newAssets));
      localStorage.setItem('site_content_timestamp', now.toString());
    } catch (error) {
      console.error('Error loading site content:', error);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();

    const subscription = supabase
      .channel('site_content_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, () => {
        loadContent();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_assets' }, () => {
        loadContent();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SiteContentContext.Provider value={{ content, assets, loading, refresh: loadContent }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return context;
}
