import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-vintage-red flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">
                Cookie-k használata
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Weboldalunk sütiket (cookie-kat) használ a felhasználói élmény javítása érdekében.
                A sütiket a weboldal működéséhez, a látogatottság méréséhez és a tartalom testreszabásához használjuk.
                A "Mindet elfogadom" gombra kattintva hozzájárulsz az összes süti használatához.
                Részletes információt az{' '}
                <a href="/privacy" className="text-vintage-red hover:underline font-medium">
                  Adatkezelési Tájékoztatóban
                </a>
                {' '}találsz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
            >
              Elutasítom
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-vintage-red hover:bg-vintage-red/90 rounded-lg transition-colors"
            >
              Mindet elfogadom
            </button>
          </div>

          <button
            onClick={handleDecline}
            className="absolute top-4 right-4 md:relative md:top-0 md:right-0 text-gray-400 hover:text-white transition-colors"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}