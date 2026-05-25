'use client';

import { useState } from 'react';
import {
  Pencil, Shield, Lock, Key, Plus,
  Trophy, Users, Building2, ChevronRight, Zap,
} from 'lucide-react';

export default function AdministrationPage() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [dataExport, setDataExport] = useState(false);
  const [frequency, setFrequency] = useState('High (15m)');
  const [sensitivity, setSensitivity] = useState(60);

  return (
    <div className="space-y-5 overflow-y-auto">

      {/* Club Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-surface-container-high rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-3xl">🏟️</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Metropolis United FC</h1>
              <p className="text-base text-on-surface-variant mt-1">Founded 1924 · Elite Pro League</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 border-2 border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
            <Pencil size={18} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-outline-variant">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Primary Contact</p>
            <p className="text-lg font-semibold text-on-surface">admin@metropolisunited.com</p>
            <p className="text-base text-on-surface-variant">+44 20 7946 0012</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Headquarters</p>
            <p className="text-lg font-semibold text-on-surface">United Training Complex</p>
            <p className="text-base text-on-surface-variant">London, SE1 7PB, UK</p>
          </div>
        </div>
      </div>

      {/* AI Insights Engine + Security & Access */}
      <div className="grid grid-cols-2 gap-5">

        {/* AI Insights Engine */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Zap size={22} className="text-[#F97316]" />
            <h2 className="text-xl font-bold text-on-surface">AI Insights Engine</h2>
          </div>

          <div className="space-y-4">

            {/* Tactical Recommendation Frequency */}
            <div className="bg-surface-container rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-on-surface mb-1">Tactical Recommendation Frequency</p>
                  <p className="text-sm text-on-surface-variant">How often the AI triggers mid-session alerts</p>
                </div>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="shrink-0 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-base font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option>High (15m)</option>
                  <option>Medium (30m)</option>
                  <option>Low (60m)</option>
                </select>
              </div>
            </div>

            {/* Fatigue Sensitivity */}
            <div className="bg-surface-container rounded-xl p-5">
              <p className="text-base font-bold text-on-surface mb-1">Fatigue Sensitivity</p>
              <p className="text-sm text-on-surface-variant mb-4">Detection threshold for injury risk warnings</p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-on-surface-variant shrink-0">Aggressive</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sensitivity}
                  onChange={e => setSensitivity(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full accent-primary cursor-pointer"
                />
                <span className="text-sm font-semibold text-on-surface-variant shrink-0">Safe</span>
              </div>
            </div>

            {/* Quote */}
            <div
              className="rounded-xl p-5 border border-[#F97316]/30 border-l-4 border-l-[#F97316]"
              style={{ background: '#FEF3EA' }}
            >
              <p className="text-base text-[#C2410C] italic leading-relaxed">
                "Higher sensitivity focuses on player longevity, while real-time frequency provides immediate tactical advantages on match days."
              </p>
            </div>

          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Lock size={22} className="text-on-surface-variant" />
              <h2 className="text-xl font-bold text-on-surface">Security & Access</h2>
            </div>
            <button className="text-base font-semibold text-primary hover:underline">Manage All Users</button>
          </div>

          <div className="space-y-4">

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-5 bg-surface-container rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Two-Factor Authentication</p>
                  <p className="text-sm text-on-surface-variant">Required for all Executive Staff</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 shrink-0 ${twoFactor ? 'bg-secondary' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${twoFactor ? 'left-7' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Data Export Restrictions */}
            <div className="flex items-center justify-between p-5 bg-surface-container rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-error" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Data Export Restrictions</p>
                  <p className="text-sm text-on-surface-variant">Prevent mass player data downloads</p>
                </div>
              </div>
              <button
                onClick={() => setDataExport(!dataExport)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 shrink-0 ${dataExport ? 'bg-secondary' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${dataExport ? 'left-7' : 'left-0.5'}`} />
              </button>
            </div>

            {/* API Key Access */}
            <div className="flex items-center justify-between p-5 bg-surface-container rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                  <Key size={22} className="text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">API Key Access</p>
                  <p className="text-sm text-on-surface-variant">External analytics integration</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface-variant">
                Disabled
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Organization Settings */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Organization Settings</h2>
          <button className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-colors">
            <Plus size={18} /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {[
            {
              icon: Trophy,
              iconBg: 'bg-primary/10',
              iconColor: 'text-primary',
              title: 'League Participation',
              desc: 'Premier Tier 1, National Cup A',
              action: 'Configure Rules',
            },
            {
              icon: Users,
              iconBg: 'bg-secondary/10',
              iconColor: 'text-secondary',
              title: 'Team Categories',
              desc: 'U18 Academy, Pro First Team, Reserve Squad',
              action: 'Manage Squads',
            },
            {
              icon: Building2,
              iconBg: 'bg-[#F97316]/10',
              iconColor: 'text-[#F97316]',
              title: 'Facilities & Arenas',
              desc: 'Metropolis Arena, Performance Lab Center',
              action: 'Facility Dashboard',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-surface-container rounded-2xl p-6 hover:shadow-sm transition-shadow">
                <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon size={26} className={card.iconColor} />
                </div>
                <p className="text-lg font-bold text-on-surface mb-2">{card.title}</p>
                <p className="text-base text-on-surface-variant leading-relaxed mb-5">{card.desc}</p>
                <button className="flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  {card.action} <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-on-surface-variant py-2">
        © 2024 TeamPilot AI Performance Systems. All rights reserved. Professional Grade Administration v4.2.0
      </p>

    </div>
  );
}