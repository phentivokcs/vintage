import { Link } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContentContext';
import { Facebook, Instagram, Music } from 'lucide-react';

export default function Footer() {
  const { content } = useSiteContent();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{content.footer.shopName}</h3>
            <p className="text-sm text-gray-400">
              {content.footer.shopDescription}
            </p>
            <div className="flex gap-4 mt-4">
              {content.footer.facebookUrl && (
                <a
                  href={content.footer.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {content.footer.instagramUrl && (
                <a
                  href={content.footer.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {content.footer.tiktokUrl && (
                <a
                  href={content.footer.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <Music className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Vásárlás</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/termekek?gender=male" className="hover:text-white transition-colors">
                  Férfi kollekció
                </Link>
              </li>
              <li>
                <Link to="/termekek?gender=female" className="hover:text-white transition-colors">
                  Női kollekció
                </Link>
              </li>
              <li>
                <Link to="/termekek?sort=newest" className="hover:text-white transition-colors">
                  Új érkezések
                </Link>
              </li>
              <li>
                <Link to="/termekek?sale=true" className="hover:text-white transition-colors">
                  Akciók
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Információ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/szallitas" className="hover:text-white transition-colors">
                  Szállítás
                </Link>
              </li>
              <li>
                <Link to="/visszakuldes" className="hover:text-white transition-colors">
                  Visszaküldés
                </Link>
              </li>
              <li>
                <Link to="/aszf" className="hover:text-white transition-colors">
                  ÁSZF
                </Link>
              </li>
              <li>
                <Link to="/adatvedelem" className="hover:text-white transition-colors">
                  Adatvédelem
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kapcsolat</h4>
            <ul className="space-y-2 text-sm">
              <li>{content.footer.email}</li>
              <li>{content.footer.phone}</li>
              <li>{content.footer.address}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col items-center gap-6 mb-6">
            <div>
              <h4 className="text-white font-semibold mb-3 text-center text-sm">Elfogadott fizetési módok</h4>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="bg-white px-4 py-2 rounded-lg">
                  <img
                    src="/barion-smart-banner-light.svg"
                    alt="Barion"
                    className="h-8"
                  />
                </div>
                <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-3">
                  <svg className="h-8" viewBox="0 0 131.39 86.9" xmlns="http://www.w3.org/2000/svg">
                    <rect fill="#ff5f00" height="57.5" rx="8.77" width="34.6" x="48.37" y="14.7"/>
                    <path d="M51.94 43.45a36.5 36.5 0 0114-28.75 36.58 36.58 0 100 57.5 36.5 36.5 0 01-14-28.75z" fill="#eb001b"/>
                    <path d="M125.1 43.45a36.58 36.58 0 01-59.16 28.75 36.58 36.58 0 000-57.5 36.58 36.58 0 0159.16 28.75z" fill="#f79e1b"/>
                  </svg>
                  <svg className="h-6" viewBox="0 0 192 60" xmlns="http://www.w3.org/2000/svg">
                    <path d="M93.2 17.5L78.4 42.5h9.2L102.4 17.5h-9.2zm-18 0L60.4 42.5h9.2L84.4 17.5h-9.2z" fill="#1a1f71"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-center text-gray-400 mb-4">
            {content.footer.aboutText}
          </p>
          <p className="text-sm text-center text-gray-400">
            {content.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
