'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* Panneau gauche*/}
      <section className="hidden lg:block lg:w-1/2 relative bg-inverse-surface overflow-hidden shrink-0">
        <Image src="/image_login.png" alt="Football player" fill sizes="50vw" className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-inverse-surface/40" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-1/3 right-8 ai-glow glass p-4 rounded-xl animate-pulse">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Predictive Stamina</p>
          <p className="text-primary-fixed-dim text-2xl font-bold">94.2%</p>
        </div>
        <div className="absolute bottom-1/3 left-8 ai-glow glass p-4 rounded-xl">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Tactical Efficiency</p>
          <p className="text-secondary-fixed-dim text-2xl font-bold">Elite</p>
        </div>
        <div className="absolute bottom-12 left-0 right-0 text-center px-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Teampilot AI</h1>
          <p className="text-outline-variant text-sm leading-relaxed">Elite Tactical Control. Master the pitch with automated intelligence.</p>
        </div>
      </section>

      {/* Panneau droit*/}
      <main className="w-full lg:w-1/2 h-screen flex flex-col bg-surface px-16 py-12">

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <Image src="/logo-icon.png" alt="TeamPilot" width={32} height={32} style={{ width: 32, height: 'auto' }} />
          </div>
          <span className="text-2xl font-bold text-on-surface">Teampilot AI</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg">

            <div className="mb-10">
              <h2 className="text-5xl font-bold text-on-surface tracking-tight leading-tight mb-3">
                Welcome Back
              </h2>
              <p className="text-on-surface-variant text-lg">
                Access your tactical dashboard and squad analytics.
              </p>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit}>

              <div className="space-y-2">
                <label htmlFor="username" className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block">
                  Identifiant
                </label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="prenom.nom"
                    autoComplete="username"
                    className="w-full pl-14 pr-5 py-5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base text-on-surface outline-none placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-14 pr-14 py-5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base text-on-surface outline-none placeholder:text-outline"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary hover:bg-primary/90 text-white text-lg font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
                {!loading && <ArrowRight size={20} />}
              </button>

            </form>

            <p className="mt-8 text-sm text-on-surface-variant text-center">
              Identifiant oublié ?{' '}
              <span className="text-primary font-bold">Contactez votre administrateur.</span>
            </p>

          </div>
        </div>

      </main>
    </div>
  );
}
