'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  // Par défaut true pendant le chargement de l'auth : évite d'afficher brièvement le mode "volontaire"
  // avant que user soit hydraté, puis de basculer — le mode forcé est le plus restrictif.
  const isForced = user?.mustChangePassword ?? true;

  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (next !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const body: Record<string, string> = { new_password: next };
    // En mode forcé, le mot de passe temporaire a déjà été vérifié au login → pas besoin de le renvoyer
    if (!isForced) body.current_password = current;

    const res = await fetch('/api/backend/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? 'Une erreur est survenue.');
    }
    setLoading(false);
  };

  const inputCls = (hasErr = false) =>
    `w-full pl-12 pr-12 py-4 bg-surface-container border ${hasErr ? 'border-error' : 'border-outline-variant'} rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all`;

  return (
    <div className="fixed inset-0 z-50 bg-surface flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">

        {!isForced && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-5 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-semibold">Retour</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          {isForced ? (
            <>
              <h1 className="text-2xl font-extrabold text-on-surface text-center">Première connexion</h1>
              <p className="text-on-surface-variant text-sm text-center mt-2 max-w-xs">
                Définissez votre mot de passe personnel pour sécuriser votre compte.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-on-surface text-center">Changer le mot de passe</h1>
              <p className="text-on-surface-variant text-sm text-center mt-2 max-w-xs">
                Entrez votre mot de passe actuel puis choisissez-en un nouveau.
              </p>
            </>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {!isForced && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <input
                    type={showCur ? 'text' : 'password'}
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={inputCls()}
                  />
                  <button type="button" onClick={() => setShowCur(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                    {showCur ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  required
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  className={inputCls()}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputCls(confirm.length > 0 && next !== confirm)}
                />
              </div>
              {confirm.length > 0 && next !== confirm && (
                <p className="text-xs text-error">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {error && <p className="text-sm text-error font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>

          </form>

          {isForced && (
            <button onClick={logout}
              className="w-full mt-4 py-3 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              Se déconnecter
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
