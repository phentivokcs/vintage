import HeroSection from '../components/HeroSection';
import CategorySection from '../components/CategorySection';
import FeaturedProducts from '../components/FeaturedProducts';
import Newsletter from '../components/Newsletter';
import SEO from '../components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO
        title="ReStyle - Használt Márkás Ruhák"
        description="Vásárolj használt márkás ruhákat kiváló állapotban. Egyedi vintage darabok férfiaknak és nőknek. Fenntartható divat, kiváló árak."
        keywords="használt ruha, vintage, márkás ruha, fenntartható divat, second hand, retro ruha"
      />
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <Newsletter />
    </>
  );
}
