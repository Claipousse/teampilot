'use client';

import { useState } from 'react';
import { Pencil, UserPlus, CalendarPlus, Users, ChevronRight } from 'lucide-react';

export default function AdministrationMobile() {
  const [timezone, setTimezone] = useState('Europe/London');

  return (
    <div className="space-y-5">

      <h1 className="text-3xl font-extrabold text-on-surface">Administration</h1>

      {/* Club Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-2xl">🏟️</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Metropolis United FC</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Fondé en 1924 · Elite Pro League</p>
            </div>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shrink-0">
            <Pencil size={16} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="space-y-3 pt-4 border-t border-outline-variant">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Contact principal</p>
            <p className="text-base font-semibold text-on-surface">admin@metropolisunited.com</p>
            <p className="text-sm text-on-surface-variant">+44 20 7946 0012</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Siège social</p>
            <p className="text-base font-semibold text-on-surface">United Training Complex</p>
            <p className="text-sm text-on-surface-variant">London, SE1 7PB, UK</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Fuseau horaire</p>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer mt-1"
            >
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Saison Active */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-on-surface">Saison active</h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-secondary/10 text-secondary text-sm font-bold rounded-full">
              2026 — 2027
            </span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Pencil size={13} /> Modifier
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between py-3.5 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Début</p>
            <p className="text-base font-semibold text-on-surface">01/08/2026</p>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Fin</p>
            <p className="text-base font-semibold text-on-surface">31/05/2027</p>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Compétitions</p>
            <p className="text-base font-semibold text-on-surface">Premier League · FA Cup</p>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Objectif</p>
            <p className="text-base font-semibold text-on-surface">Top 4 · Quart FA Cup</p>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Statut</p>
            <p className="text-base font-semibold text-secondary">En cours</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <h2 className="text-xl font-bold text-on-surface mb-4">Actions</h2>

        <div className="space-y-3">

          <a href="/joueurs" className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-on-surface">Ajouter un joueur</p>
                <p className="text-sm text-on-surface-variant">Créer un nouveau profil joueur</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </a>

          <a href="/calendrier" className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <CalendarPlus size={20} className="text-secondary" />
              </div>
              <div>
                <p className="text-base font-bold text-on-surface">Planifier un événement</p>
                <p className="text-sm text-on-surface-variant">Ajouter au calendrier</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </a>

          <a href="#" className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} className="text-on-surface-variant" />
              </div>
              <div>
                <p className="text-base font-bold text-on-surface">Gérer les membres</p>
                <p className="text-sm text-on-surface-variant">Modifier ou supprimer des comptes</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </a>

        </div>
      </div>
    </div>
  );
}