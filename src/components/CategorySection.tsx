import { ShirtIcon, WatchIcon, ShoppingBagIcon } from 'lucide-react';
import { useSiteContent } from '../contexts/SiteContentContext';

const defaultCategories = [
  {
    key: 'tops',
    icon: ShirtIcon,
    defaultImage: 'https://images.pexels.com/photos/4210850/pexels-photo-4210850.jpeg',
  },
  {
    key: 'accessories',
    icon: WatchIcon,
    defaultImage: 'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg',
  },
  {
    key: 'shoes',
    icon: ShoppingBagIcon,
    defaultImage: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg',
  },
];

export default function CategorySection() {
  const { content } = useSiteContent();

  const categories = defaultCategories.map((cat) => {
    const categoryData = content.category[cat.key as 'tops' | 'accessories' | 'shoes'];
    return {
      ...cat,
      title: categoryData.title,
      description: categoryData.description,
      href: categoryData.link,
      image: categoryData.image || cat.defaultImage,
    };
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategóriák</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Fedezd fel válogatott kollekcióinkat
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.href}
                href={category.href}
                className="group relative overflow-hidden rounded-xl bg-gray-900 aspect-[4/3] hover:transform hover:scale-[1.02] transition-all duration-300"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity"
                  style={{ backgroundImage: `url(${category.image})` }}
                />

                <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{category.title}</h3>
                  <p className="text-gray-200 text-sm">{category.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
