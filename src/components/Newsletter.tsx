import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useSiteContent } from '../contexts/SiteContentContext';

export default function Newsletter() {
  const { content } = useSiteContent();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Email küldése sikertelen');
      }

      setStatus('success');
      setEmail('');

      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Newsletter hiba:', error);
      setStatus('error');

      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-bold mb-4">{content.newsletter.title}</h2>
          <p className="text-gray-300 mb-8">
            {content.newsletter.description}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.newsletter.placeholder}
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
              required
            />
            <button
              type="submit"
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {content.newsletter.buttonText}
            </button>
          </form>

          {status === 'success' && (
            <p className="mt-4 text-green-400 font-medium">
              {content.newsletter.successMessage}
            </p>
          )}

          {status === 'error' && (
            <p className="mt-4 text-red-400 font-medium">
              Hiba történt. Kérjük, próbáld újra később.
            </p>
          )}

          <p className="mt-6 text-sm text-gray-400">
            {content.newsletter.privacyText}
          </p>
        </div>
      </div>
    </section>
  );
}
