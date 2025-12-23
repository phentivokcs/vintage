import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title = 'VintageVibes - Használt márkás ruhák',
  description = 'Vásárolj használt márkás ruhákat kiváló állapotban. Egyedi vintage darabok, fenntartható divat.',
  keywords = 'használt ruha, vintage, márkás ruha, fenntartható divat, second hand',
  image = '/og-image.jpg',
  url,
  type = 'website',
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:type', content: type },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: image },
    ];

    if (url) {
      metaTags.push({ property: 'og:url', content: url });
    }

    metaTags.forEach(({ name, property, content }) => {
      const attr = name ? 'name' : 'property';
      const value = name || property;
      let element = document.querySelector(`meta[${attr}="${value}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, value!);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });
  }, [title, description, keywords, image, url, type]);

  return null;
}
