import { useSiteContent } from '../contexts/SiteContentContext';

export default function HeroSection() {
  const { content, loading } = useSiteContent();

  if (loading) {
    return (
      <section className="relative h-[500px] lg:h-[600px] overflow-hidden bg-gray-900 animate-pulse">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl space-y-4">
            <div className="h-16 bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            <div className="flex gap-4">
              <div className="h-12 bg-gray-700 rounded w-32"></div>
              <div className="h-12 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const defaultImage = 'https://images.pexels.com/photos/7679454/pexels-photo-7679454.jpeg';
  const backgroundImage = content.hero.bannerImage || defaultImage;

  return (
    <section className="relative h-[500px] lg:h-[600px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {content.hero.title}
          </h1>
          <p className="text-lg lg:text-xl text-slate-200 mb-8 leading-relaxed">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={content.hero.ctaLink}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              {content.hero.ctaText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
