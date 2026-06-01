'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Leaf, Dumbbell, Users, Trophy, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

type MobileEvent = {
  time: string;
  title: string;
  subtitle: string;
  border: string;
  IconComp: LucideIcon;
  iconColor: string;
  iconBg: string;
  isMatch?: boolean;
};

const EVENT_POOLS: MobileEvent[][] = [
  [
    { time: '09:30', title: 'Séance Vidéo', subtitle: 'Analyse Tactique - Salle 1', border: 'border-l-primary', IconComp: Video, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
    { time: '14:00', title: 'Entraînement Physique', subtitle: 'Terrain Principal - 90min', border: 'border-l-secondary', IconComp: Dumbbell, iconColor: 'text-secondary', iconBg: 'bg-secondary/10' },
  ],
  [
    { time: '10:00', title: 'Récupération Active', subtitle: 'Cryothérapie & Massage', border: 'border-l-secondary', IconComp: Leaf, iconColor: 'text-secondary', iconBg: 'bg-secondary/10' },
    { time: '15:30', title: 'Réunion Tactique', subtitle: 'Salle de conférence A', border: 'border-l-primary', IconComp: Users, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  ],
  [
    { time: '08:00', title: 'Gym - Force & Cardio', subtitle: 'Salle de musculation', border: 'border-l-primary', IconComp: Dumbbell, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  ],
  [
    { time: '11:00', title: 'Analyse Adversaire', subtitle: 'Préparation match - Salle 2', border: 'border-l-primary', IconComp: Video, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
    { time: '17:00', title: 'Match vs Arsenal', subtitle: 'Stade Principal · Domicile', border: 'border-l-error', IconComp: Trophy, iconColor: 'text-error', iconBg: 'bg-error/10', isMatch: true },
  ],
  [
    { time: '09:00', title: 'Pressing Drills', subtitle: 'Terrain 2 - Séance intensive', border: 'border-l-secondary', IconComp: Leaf, iconColor: 'text-secondary', iconBg: 'bg-secondary/10' },
    { time: '14:00', title: 'Bilan Médical Équipe', subtitle: 'Aile médicale', border: 'border-l-primary', IconComp: Users, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  ],
  [
    { time: '10:30', title: 'Débrief Vidéo', subtitle: 'Analyse du dernier match', border: 'border-l-primary', IconComp: Video, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  ],
  [
    { time: '09:00', title: 'Séance Cardio Légère', subtitle: "Terrain d'entraînement", border: 'border-l-secondary', IconComp: Dumbbell, iconColor: 'text-secondary', iconBg: 'bg-secondary/10' },
    { time: '16:00', title: 'Tactique Défensive', subtitle: 'Session vidéo + terrain', border: 'border-l-primary', IconComp: Users, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  ],
];

function getEventsForKey(key: string): MobileEvent[] {
  const parts = key.split('-').map(Number);
  const hash = Math.abs(parts[0] * 12 * 31 + parts[1] * 31 + parts[2]);
  return EVENT_POOLS[hash % EVENT_POOLS.length];
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(base: Date, offset: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + offset * 7 + i);
    return {
      label: DAYS_SHORT[i],
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    };
  });
}

function getWeekLabel(days: ReturnType<typeof getWeekDays>) {
  const first = days[0];
  const last = days[6];
  if (first.month === last.month) return `${MONTHS_FR[first.month]} ${first.year}`;
  return `${MONTHS_FR[first.month]} — ${MONTHS_FR[last.month]} ${last.year}`;
}

export default function CalendrierMobile() {
  const today = new Date();
  const baseMondayRef = getMondayOfWeek(today);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = getWeekDays(baseMondayRef, weekOffset);
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const [activeKey, setActiveKey] = useState(todayKey);

  const activeEvents = getEventsForKey(activeKey);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Calendrier</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-error rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-all">
          + Add Event
        </button>
      </div>

      {/* Navigation semaine */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <ChevronLeft size={20} className="text-on-surface-variant" />
          </button>
          <p className="text-base font-bold text-on-surface uppercase tracking-wider">
            {getWeekLabel(weekDays)}
          </p>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const isActive = d.key === activeKey;
            const hasMatch = getEventsForKey(d.key).some(e => e.isMatch);
            return (
              <button
                key={d.key}
                onClick={() => setActiveKey(d.key)}
                className={`flex flex-col items-center py-3 px-1 rounded-2xl transition-all ${isActive
                    ? hasMatch ? 'bg-error text-white shadow-md' : 'bg-primary text-white shadow-md'
                    : hasMatch ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${isActive ? 'text-white/70' : hasMatch ? 'text-error/60' : 'text-on-surface-variant'
                  }`}>
                  {d.label}
                </span>
                <span className="text-lg font-extrabold leading-tight">{d.date}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Événements du jour */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-on-surface">Événements du jour</h2>
          <span className="text-base font-semibold text-on-surface-variant">{activeEvents.length} session{activeEvents.length > 1 ? 's' : ''}</span>
        </div>

        {activeEvents.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-8 text-center">
            <p className="text-base text-on-surface-variant">Aucun événement ce jour</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeEvents.map((event, i) => {
              const Icon = event.IconComp;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0 w-14">
                    <span className="text-base font-bold text-on-surface">{event.time}</span>
                    {i < activeEvents.length - 1 && (
                      <div className="w-px flex-1 bg-outline-variant mt-2 min-h-[60px]" />
                    )}
                  </div>

                  <div className={`flex-1 border border-outline-variant border-l-4 ${event.border} rounded-2xl p-4 mb-2 ${event.isMatch ? 'bg-error/5' : 'bg-surface-container-low'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg font-bold mb-1 ${event.isMatch ? 'text-error' : 'text-on-surface'}`}>
                          {event.title}
                        </p>
                        <p className="text-sm text-on-surface-variant">{event.subtitle}</p>
                      </div>
                      <div className={`w-10 h-10 ${event.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon size={20} className={event.iconColor} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}