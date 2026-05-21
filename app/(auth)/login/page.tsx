'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden">

      {/* Panneau gauche*/}
      <section className="hidden lg:block lg:w-1/2 relative bg-inverse-surface overflow-hidden shrink-0">
        <Image src="/image_login.png" alt="Football player" fill className="object-cover object-center" priority />
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
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">TeamPilot AI</h1>
          <p className="text-outline-variant text-sm leading-relaxed">Elite Tactical Control. Master the pitch with automated intelligence.</p>
        </div>
      </section>

      {/* Panneau droit*/}
      <main className="w-full lg:w-1/2 h-screen flex flex-col bg-surface px-16 py-12">

        {/* Logo — haut gauche */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <Image src="/logo-icon.png" alt="TeamPilot" width={32} height={32} />
          </div>
          <span className="text-2xl font-bold text-on-surface">TeamPilot AI</span>
        </div>

        {/* Contenu centré verticalement et horizontalement */}
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

            <form className="space-y-7">

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block">
                  Manager Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="manager@teampilot.ai"
                    className="w-full pl-14 pr-5 py-5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base text-on-surface outline-none placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block">
                    Password
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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

              <div className="flex items-center gap-3">
                <input id="remember" name="remember" type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <label htmlFor="remember" className="text-base text-on-surface-variant">Remember this device for 30 days</label>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-primary hover:bg-primary-container text-white text-lg font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Sign In to Dashboard
                <ArrowRight size={20} />
              </button>

            </form>

            <p className="mt-8 text-sm text-on-surface-variant text-center">
              New to the platform?{' '}
              <a href="#" className="text-primary font-bold hover:underline">Request a Demo</a>
            </p>

          </div>
        </div>

      </main>
    </div>
  );
}