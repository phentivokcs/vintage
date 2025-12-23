import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <>
      <SEO
        title="404 - Az oldal nem található"
        description="A keresett oldal nem található. Térj vissza a főoldalra és folytasd a böngészést."
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-vintage-red/10 rounded-full mb-6">
              <span className="text-6xl font-bold text-vintage-red">404</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Hoppá! Ez az oldal nem található
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Sajnáljuk, de a keresett oldal nem létezik vagy át lett helyezve.
              Lehet, hogy elírás történt az URL-ben, vagy az oldal már nem elérhető.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors"
            >
              <Home className="w-5 h-5" />
              Vissza a főoldalra
            </Link>

            <Link
              to="/termekek"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5" />
              Böngészés a termékek között
            </Link>
          </div>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza az előző oldalra
          </button>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Népszerű oldalak:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/termekek" className="text-sm text-vintage-red hover:underline">
                Termékek
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/szallitas" className="text-sm text-vintage-red hover:underline">
                Szállítás
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/visszakuldes" className="text-sm text-vintage-red hover:underline">
                Visszaküldés
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/kapcsolat" className="text-sm text-vintage-red hover:underline">
                Kapcsolat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}