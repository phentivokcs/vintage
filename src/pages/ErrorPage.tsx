import { Link } from 'react-router-dom';
import { Home, RefreshCw, Mail } from 'lucide-react';
import SEO from '../components/SEO';

export default function ErrorPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <SEO
        title="500 - Szerverhiba"
        description="Valami hiba történt. Próbáld újra később vagy lépj kapcsolatba velünk."
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-red-100 rounded-full mb-6">
              <span className="text-6xl font-bold text-red-600">500</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Hoppá! Valami hiba történt
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Sajnáljuk, de egy váratlan hiba történt a szerverünkön.
              A fejlesztőink már dolgoznak a probléma megoldásán.
              Kérlek próbáld újra később vagy lépj kapcsolatba velünk, ha a probléma továbbra is fennáll.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Próbáld újra
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Home className="w-5 h-5" />
              Vissza a főoldalra
            </Link>

            <Link
              to="/kapcsolat"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Kapcsolat
            </Link>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Mi okozhatja ezt a hibát?
            </h2>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Ideiglenes szerver probléma</li>
              <li>Túlterhelt rendszer</li>
              <li>Karbantartás</li>
              <li>Átmeneti hálózati hiba</li>
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Ha a probléma továbbra is fennáll, kérlek jelezd nekünk az{' '}
              <Link to="/kapcsolat" className="text-vintage-red hover:underline font-medium">
                kapcsolat
              </Link>
              {' '}oldalon keresztül.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}