import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new',
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Hiba történt az üzenet küldésekor');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Hiba történt az üzenet küldésekor. Kérjük, próbáld újra később!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kapcsolat</h1>
          <p className="text-lg text-gray-600">
            Van kérdésed? Írj nekünk bátran!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-gray-600">info@vintagevibes.hu</p>
          </div>

          <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Telefon</h3>
            <p className="text-gray-600">+36 30 123 4567</p>
          </div>

          <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cím</h3>
            <p className="text-gray-600">8446 Kislőd, Bocskay utca 14.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-vintage-cream-light rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Küldj üzenetet</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                Köszönjük az üzeneted! Hamarosan válaszolunk.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Név
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Teljes neved"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email cím
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tárgy
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Miben segíthetünk?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üzenet
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Írd le részletesen, miben segíthetünk..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-black text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Küldés...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Üzenet küldése
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold mb-4">Gyakran Ismételt Kérdések</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">Mennyi a szállítási idő?</h4>
              <p className="text-gray-600">
                A megrendeléseket általában 2-3 munkanapon belül szállítjuk ki.
              </p>
            </div>

            <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">Van lehetőség személyes átvételre?</h4>
              <p className="text-gray-600">
                Igen, előzetes egyeztetés után üzletünkben is átveheted a rendelésedet.
              </p>
            </div>

            <div className="bg-vintage-cream-light p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">Vissza lehet küldeni a terméket?</h4>
              <p className="text-gray-600">
                Igen, 14 napon belül indoklás nélkül visszaküldheted a terméket. Részletek az{' '}
                <a href="/visszakuldes" className="text-blue-600 hover:underline">
                  itt olvashatók
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
