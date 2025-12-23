import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        alert('Sikeres regisztráció! Most már bejelentkezhetsz.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = '/';
      }
    } catch (error: any) {
      alert(error.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <LogIn className="w-12 h-12 text-gray-900 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">
              {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
            </h2>
            <p className="text-gray-600 mt-2">
              {mode === 'login'
                ? 'Jelentkezz be a fiókodba'
                : 'Hozz létre egy új fiókot'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail cím
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="nev@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jelszó
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Folyamatban...
                </>
              ) : mode === 'login' ? (
                'Bejelentkezés'
              ) : (
                'Regisztráció'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gray-600 hover:text-gray-900"
            >
              {mode === 'login'
                ? 'Még nincs fiókod? Regisztrálj!'
                : 'Van már fiókod? Jelentkezz be!'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-600 hover:text-gray-900">
            Vissza a főoldalra
          </a>
        </div>
      </div>
    </div>
  );
}
