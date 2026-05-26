'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Leaf } from 'lucide-react';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const BASE_MONDAY = new Date(2026, 4, 25);

function getWeekDays(weekOffset: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(BASE_MONDAY);
    d.setDate(BASE_MONDAY.getDate() + weekOffset * 7 + i);
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
  if (first.month === last.month) {
    return `${MONTHS_FR[first.month]} ${first.year}`;
  }
  return `${MONTHS_FR[first.month]} — ${MONTHS_FR[last.month]} ${last.year}`;
}

const events = [
  {
    time: '09:30',
    title: 'Séance Vidéo',
    subtitle: 'Analyse Tactique - Salle 1',
    border: 'border-l-primary',
    Icon: Video,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    participants: true,
  },
  {
    time: '11:00',
    title: 'Récupération Active',
    subtitle: 'Cryothérapie & Massage',
    border: 'border-l-secondary',
    Icon: Leaf,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
    done: true,
  },
  {
    time: '14:00',
    title: 'Gestion de Fatigue',
    subtitle: 'Repos suggéré pour 4 joueurs clés.',
    border: 'border-l-[#F97316]',
    isAI: true,
  },
];

export default function CalendrierMobile() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);
  const [activeKey, setActiveKey] = useState(weekDays[2].key); // Mercredi par défaut

  const handlePrev = () => {
    setWeekOffset(w => w - 1);
  };

  const handleNext = () => {
    setWeekOffset(w => w + 1);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Calendrier</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-error rounded-xl text-white text-sm font-bold transition-all active:scale-[0.98]">
          + Add Event
        </button>
      </div>

      {/* Navigation semaine */}
      <div>
        {/* Mois + année + flèches */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <ChevronLeft size={20} className="text-on-surface-variant" />
          </button>

          <p className="text-base font-bold text-on-surface uppercase tracking-wider">
            {getWeekLabel(weekDays)}
          </p>

          <button
            onClick={handleNext}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const isActive = d.key === activeKey;
            return (
              <button
                key={d.key}
                onClick={() => setActiveKey(d.key)}
                className={`flex flex-col items-center py-3 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                  isActive ? 'text-white/70' : 'text-on-surface-variant'
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
          <span className="text-base font-semibold text-on-surface-variant">3 sessions</span>
        </div>

        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-4">

              {/* Heure + ligne verticale */}
              <div className="flex flex-col items-center shrink-0 w-14">
                <span className="text-base font-bold text-on-surface">{event.time}</span>
                {i < events.length - 1 && (
                  <div className="w-px flex-1 bg-outline-variant mt-2 min-h-[80px]" />
                )}
              </div>

              {/* Card */}
              <div className={`flex-1 bg-surface-container-low border border-outline-variant border-l-4 ${event.border} rounded-2xl p-4 mb-2`}>

                {event.isAI && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[#F97316] text-sm">✦</span>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-widest">
                      Optimisation IA
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-on-surface mb-1">{event.title}</p>
                    <p className="text-sm text-on-surface-variant">{event.subtitle}</p>
                  </div>

                  {event.Icon && (
                    <div className={`w-10 h-10 ${event.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <event.Icon size={20} className={event.iconColor} />
                    </div>
                  )}

                  {event.isAI && (
                    <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0">
                      <ChevronRight size={20} className="text-[#F97316]" />
                    </div>
                  )}
                </div>

                {event.participants && (
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2].map((_, j) => (
                      <div
                        key={j}
                        className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center -ml-1 first:ml-0"
                      >
                        <span className="text-xs font-bold text-on-surface-variant">P{j + 1}</span>
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-primary border-2 border-surface-container-lowest flex items-center justify-center -ml-1">
                      <span className="text-xs font-bold text-white">+18</span>
                    </div>
                  </div>
                )}

                {event.done && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-sm font-bold text-secondary">TERMINÉ</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}