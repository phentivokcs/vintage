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
