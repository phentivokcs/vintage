/*
  # Seed Default Site Content

  ## Purpose
  Populate the site_content table with default values for all configurable elements.
  These values can be overridden through the admin panel.

  ## Sections
  1. Hero - Main banner content
  2. Promo - Promotional banners (3x)
  3. Category - Category header settings
  4. Footer - Footer content and links
  5. SEO - Meta tags and SEO settings
  6. Newsletter - Newsletter section text
  7. Design - Colors and branding
*/

-- Hero Section
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('hero', 'title', '{"hu": "Fenntartható Divat, Egyedi Stílus"}', 'json'),
  ('hero', 'subtitle', '{"hu": "Fedezd fel gondosan válogatott használt ruháinkat. Minden darab egy történet, minden vásárlás egy lépés a fenntarthatóság felé."}', 'json'),
  ('hero', 'cta_text', '{"hu": "Böngészés"}', 'json'),
  ('hero', 'cta_link', '{"hu": "/products"}', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Promo Banners (3 slots)
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('promo', 'banner_1_title', '{"hu": "Új Érkezések"}', 'json'),
  ('promo', 'banner_1_link', '{"hu": "/products?sort=newest"}', 'json'),
  ('promo', 'banner_1_active', '{"value": true}', 'boolean'),
  
  ('promo', 'banner_2_title', '{"hu": "Exkluzív Márkák"}', 'json'),
  ('promo', 'banner_2_link', '{"hu": "/products?brands=premium"}', 'json'),
  ('promo', 'banner_2_active', '{"value": true}', 'boolean'),
  
  ('promo', 'banner_3_title', '{"hu": "Sale"}', 'json'),
  ('promo', 'banner_3_link', '{"hu": "/products?sale=true"}', 'json'),
  ('promo', 'banner_3_active', '{"value": false}', 'boolean')
ON CONFLICT (section, key) DO NOTHING;

-- Category Headers
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('category', 'men_title', '{"hu": "Férfi Ruházat"}', 'json'),
  ('category', 'men_description', '{"hu": "Prémium minőségű használt férfi ruházat"}', 'json'),
  
  ('category', 'women_title', '{"hu": "Női Ruházat"}', 'json'),
  ('category', 'women_description', '{"hu": "Egyedi női ruhák és kiegészítők"}', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Footer
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('footer', 'shop_name', '{"hu": "Vintage Vibes"}', 'json'),
  ('footer', 'shop_description', '{"hu": "Magyarország vezető használt ruha webshopja. Fenntartható divat, megfizethető áron."}', 'json'),
  ('footer', 'email', '{"value": "info@vintagevibes.hu"}', 'text'),
  ('footer', 'phone', '{"value": "+36 20 123 4567"}', 'text'),
  ('footer', 'address', '{"hu": "1052 Budapest, Petőfi Sándor utca 1."}', 'json'),
  
  ('footer', 'facebook_url', '{"value": "https://facebook.com/vintagevibes"}', 'url'),
  ('footer', 'instagram_url', '{"value": "https://instagram.com/vintagevibes"}', 'url'),
  ('footer', 'tiktok_url', '{"value": ""}', 'url'),
  
  ('footer', 'about_text', '{"hu": "A Vintage Vibes 2020-ban indult azzal a céllal, hogy a fenntartható divat elérhető legyen mindenki számára. Minden terméket gondosan válogatunk és ellenőrzünk."}', 'json'),
  ('footer', 'copyright', '{"hu": "© 2025 Vintage Vibes. Minden jog fenntartva."}', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- SEO Settings
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('seo', 'meta_title', '{"hu": "Vintage Vibes - Használt Ruha Webshop"}', 'json'),
  ('seo', 'meta_description', '{"hu": "Prémium minőségű használt ruhák, cipők és kiegészítők. Fenntartható divat, egyedi darabok, versenyképes árak. Ingyenes szállítás 15.000 Ft felett!"}', 'json'),
  ('seo', 'meta_keywords', '{"hu": "használt ruha, vintage, second hand, fenntartható divat, online webshop"}', 'json'),
  ('seo', 'og_title', '{"hu": "Vintage Vibes - Fenntartható Használt Ruha"}', 'json'),
  ('seo', 'og_description', '{"hu": "Fedezd fel egyedi használt ruha kollekcióinkat!"}', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Newsletter Section
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('newsletter', 'title', '{"hu": "Iratkozz fel hírlevelünkre"}', 'json'),
  ('newsletter', 'description', '{"hu": "Legyél az első, aki értesül az új termékekről, exkluzív kedvezményekről és divattippekről!"}', 'json'),
  ('newsletter', 'button_text', '{"hu": "Feliratkozás"}', 'json'),
  ('newsletter', 'placeholder', '{"hu": "Add meg az email címed"}', 'json'),
  ('newsletter', 'success_message', '{"hu": "Köszönjük! Hamarosan küldünk egy megerősítő emailt."}', 'json'),
  ('newsletter', 'privacy_text', '{"hu": "Az adataidat bizalmasan kezeljük. Bármikor leiratkozhatsz."}', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Design Settings
INSERT INTO site_content (section, key, value, content_type) VALUES
  ('design', 'primary_color', '{"value": "#2563eb"}', 'color'),
  ('design', 'secondary_color', '{"value": "#7c3aed"}', 'color'),
  ('design', 'accent_color', '{"value": "#f59e0b"}', 'color'),
  ('design', 'success_color', '{"value": "#10b981"}', 'color'),
  ('design', 'error_color', '{"value": "#ef4444"}', 'color')
ON CONFLICT (section, key) DO NOTHING;