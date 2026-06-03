'use client';

import { useState } from 'react';
import { Pencil, UserPlus, CalendarPlus, Users, ChevronRight } from 'lucide-react';

export default function AdministrationDesktop() {
  const [timezone, setTimezone] = useState('Europe/London');

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
              <p className="text-base text-on-surface-variant mt-1">Fondé en 1924 · Elite Pro League</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 border-2 border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
            <Pencil size={18} />
            Modifier le profil
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-outline-variant">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Contact principal</p>
            <p className="text-base font-semibold text-on-surface">admin@metropolisunited.com</p>
            <p className="text-sm text-on-surface-variant">+44 20 7946 0012</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Siège social</p>
            <p className="text-base font-semibold text-on-surface">United Training Complex</p>
            <p className="text-sm text-on-surface-variant">London, SE1 7PB, UK</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Fuseau horaire</p>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Saison Active + Actions */}
      <div className="grid grid-cols-2 gap-5 items-stretch">

        {/* Saison Active */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold text-on-surface">Saison active</h2>
    <div className="flex items-center gap-3">
      <span className="px-3 py-1.5 bg-secondary/10 text-secondary text-sm font-bold rounded-full">2026 — 2027</span>
      <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
        <Pencil size={15} /> Modifier
      </button>
    </div>
  </div>

  <div className="flex-1">
    <div className="flex items-center justify-between py-4 border-b border-outline-variant">
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Début de saison</p>
      <p className="text-base font-semibold text-on-surface">01/08/2026</p>
    </div>
    <div className="flex items-center justify-between py-4 border-b border-outline-variant">
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Fin de saison</p>
      <p className="text-base font-semibold text-on-surface">31/05/2027</p>
    </div>
    <div className="flex items-center justify-between py-4 border-b border-outline-variant">
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Compétitions</p>
      <p className="text-base font-semibold text-on-surface">Premier League · FA Cup</p>
    </div>
    <div className="flex items-center justify-between py-4 border-b border-outline-variant">
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Objectif</p>
      <p className="text-base font-semibold text-on-surface">Top 4 · Quart FA Cup</p>
    </div>
    <div className="flex items-center justify-between py-4">
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Statut</p>
      <p className="text-base font-semibold text-secondary">En cours</p>
    </div>
  </div>
</div>

        {/* Actions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-on-surface mb-6">Actions</h2>

          <div className="flex flex-col gap-4 flex-1">

            <a href="/joueurs" className="flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <UserPlus size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Ajouter un joueur</p>
                  <p className="text-sm text-on-surface-variant">Créer un nouveau profil joueur dans l'effectif</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-on-surface-variant shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <a href="/calendrier?new=true" className="flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                  <CalendarPlus size={22} className="text-secondary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Planifier un événement</p>
                  <p className="text-sm text-on-surface-variant">Ajouter un entraînement, match ou réunion au calendrier</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-on-surface-variant shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <a href="#" className="flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                  <Users size={22} className="text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Gérer les membres</p>
                  <p className="text-sm text-on-surface-variant">Consulter, modifier ou supprimer des comptes membres</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-on-surface-variant shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}