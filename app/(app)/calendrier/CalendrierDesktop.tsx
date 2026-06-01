'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

type CalEvent = {
  time: string;
  title: string;
  sub: string;
  color: string;
};

type CalCell = {
  day: number;
  outside?: boolean;
  weekend?: boolean;
  isMatch?: boolean;
  events: CalEvent[];
};

type DayDetail = {
  day: number;
  month: number;
  year: number;
  events: CalEvent[];
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MATCH_DAYS = new Set([5, 19]);
const MAX_VISIBLE = 2;

const EVENT_TEMPLATES: Record<number, CalEvent[]> = {
  1: [{ time: '09:00', title: 'Recovery Session', sub: 'Main Pitch · 90m', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  2: [{ time: '14:00', title: 'Tactical Review', sub: 'Video Room', color: 'border-l-4 border-outline bg-surface-container text-on-surface' }],
  5: [
    { time: '10:00', title: 'Pre-Match Training', sub: 'Physical Activation', color: 'border-l-4 border-error bg-error/10 text-error' },
    { time: '15:00', title: 'Match Away', sub: 'Etihad Stadium (A)', color: 'bg-error text-white' },
  ],
  7: [{ time: '11:00', title: 'Tactical Analysis', sub: 'Video Room', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  9: [{ time: '09:30', title: 'Gym Session', sub: 'Weights & Cardio', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  10: [{ time: '10:00', title: 'Outdoor Drill', sub: 'Finishing - Pitch 2', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' }],
  14: [{ time: '10:00', title: 'Set Piece Training', sub: 'Main Pitch', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  16: [{ time: '09:00', title: 'Strength & Conditioning', sub: 'Gym', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  17: [
    { time: '08:00', title: 'Physio Assessment', sub: 'Medical Wing', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' },
    { time: '11:00', title: 'Tactical Meeting', sub: 'Conference Room A', color: 'border-l-4 border-outline bg-surface-container text-on-surface' },
    { time: '15:00', title: 'Recovery Pool', sub: 'Aquatic Center', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' },
  ],
  19: [
    { time: '11:00', title: 'Pre-Match Activation', sub: 'Main Pitch', color: 'border-l-4 border-error bg-error/10 text-error' },
    { time: '17:00', title: 'Home Match', sub: 'Main Stadium', color: 'bg-error text-white' },
  ],
  22: [{ time: '10:30', title: 'Tactical Debrief', sub: 'Video Room', color: 'border-l-4 border-outline bg-surface-container text-on-surface' }],
  23: [{ time: '09:00', title: 'Pressing Drills', sub: 'Pitch 2', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  25: [{ time: '11:00', title: 'Squad Assessment', sub: 'Medical Wing', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' }],
  28: [{ time: '09:00', title: 'Pre-Match Training', sub: 'Main Pitch · 60m', color: 'border-l-4 border-primary bg-primary/10 text-primary' }],
  30: [{ time: '10:00', title: 'Activation Session', sub: 'Pitch 1', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' }],
};

function generateWeeks(year: number, month: number): CalCell[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
  const weeks: CalCell[][] = [];
  let week: CalCell[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = new Date(year, month, -(firstDayOfWeek - 1 - i));
    week.push({ day: d.getDate(), outside: true, weekend: d.getDay() === 0 || d.getDay() === 6, events: [] });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    week.push({
      day: d,
      outside: false,
      weekend: date.getDay() === 0 || date.getDay() === 6,
      isMatch: MATCH_DAYS.has(d),
      events: EVENT_TEMPLATES[d] || [],
    });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    let next = 1;
    while (week.length < 7) {
      const d = new Date(year, month + 1, next);
      week.push({ day: next++, outside: true, weekend: d.getDay() === 0 || d.getDay() === 6, events: [] });
    }
    weeks.push(week);
  }
  return weeks;
}

export default function CalendrierDesktop() {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const prev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const next = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const openPanel = (cell: CalCell) => {
    setDayDetail({ day: cell.day, month: current.getMonth(), year: current.getFullYear(), events: cell.events });
    setTimeout(() => setPanelVisible(true), 10);
  };

  const closePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setDayDetail(null), 300);
  };

  const weeks = generateWeeks(current.getFullYear(), current.getMonth());

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header */}
      <div className="flex items-center gap-6 mb-5 shrink-0">
        <div className="w-52 shrink-0">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            {MONTHS[current.getMonth()]}<br />{current.getFullYear()}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="ml-auto shrink-0">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white text-base font-semibold rounded-xl transition-colors">
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      {/* Calendrier + panneau */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Grille */}
        <div className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col">

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 border-b border-outline-variant shrink-0">
            {DAYS.map((day, i) => (
              <div key={day} className={`py-3 text-center text-sm font-bold uppercase tracking-widest ${i >= 5 ? 'text-primary' : 'text-on-surface-variant'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Semaines */}
          <div className="flex-1 min-h-0 flex flex-col">
            {weeks.map((week, wi) => (
              <div key={wi} className={`grid grid-cols-7 flex-1 ${wi < weeks.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                {week.map((cell, ci) => {
                  const visible = cell.events.slice(0, MAX_VISIBLE);
                  const hidden = cell.events.length - MAX_VISIBLE;
                  return (
                    <div
                      key={ci}
                      className={`p-2 flex flex-col gap-1 min-h-0 overflow-hidden ${
                        ci < 6 ? 'border-r border-outline-variant' : ''
                      } ${
                        cell.outside ? 'bg-surface-container/40' :
                        cell.isMatch ? 'bg-error/5' : ''
                      }`}
                    >
                      {/* Numéro + indicateur match */}
                      <div className="flex items-center justify-between shrink-0">
                        <p className={`text-sm font-bold ${
                          cell.outside ? 'text-on-surface-variant/30' :
                          cell.isMatch ? 'text-error' :
                          cell.weekend ? 'text-primary' :
                          'text-on-surface'
                        }`}>
                          {cell.day}
                        </p>
                        {cell.isMatch && !cell.outside && (
                          <span className="text-[10px] font-bold text-error uppercase tracking-wide">⚽ Match</span>
                        )}
                      </div>

                      {/* Événements */}
                      {!cell.outside && (
                        <>
                          <div className="flex flex-col gap-1 flex-1 min-h-0">
                            {visible.map((event, ei) => (
                              <div key={ei} className={`px-1.5 py-1 rounded-lg text-xs font-medium ${event.color}`}>
                                {event.time && <p className="font-bold text-xs">{event.time}</p>}
                                <p className="font-semibold leading-tight truncate text-xs">{event.title}</p>
                                {event.sub && <p className="opacity-70 leading-tight truncate text-[10px]">{event.sub}</p>}
                              </div>
                            ))}
                          </div>

                          {/* Bouton voir plus */}
                          {hidden > 0 && (
                            <button
                              onClick={() => openPanel(cell)}
                              className="mt-auto w-full text-center text-sm font-bold text-primary hover:bg-primary/10 transition-colors py-1 rounded-lg"
                            >
                              +{hidden} voir plus
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Panneau détail */}
        {dayDetail && (
          <div className={`w-110 shrink-0 transition-all duration-300 ${panelVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl h-full flex flex-col overflow-hidden">

              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <div>
                  <p className="text-xl font-bold text-on-surface">
                    {MONTHS[dayDetail.month]} {dayDetail.day}
                  </p>
                  <p className="text-base text-on-surface-variant">
                    {dayDetail.events.length} événement{dayDetail.events.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={closePanel} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {dayDetail.events.map((event, i) => (
                  <div key={i} className={`px-4 py-3 rounded-xl ${event.color}`}>
                    {event.time && <p className="text-sm font-bold mb-1">{event.time}</p>}
                    <p className="text-base font-semibold">{event.title}</p>
                    {event.sub && <p className="opacity-70 text-sm mt-0.5">{event.sub}</p>}
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}