'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Download, Info, MapPin, Building2, Mic, Zap } from 'lucide-react';

type CalEvent = { type: 'badge'; label: string; color: string } | { type: 'event'; time: string; title: string; sub: string; color: string };
type CalCell = { day: number; outside?: boolean; weekend?: boolean; events: CalEvent[] };

const weeks: CalCell[][] = [
  [
    { day: 30, outside: true, events: [] },
    { day: 1, events: [
      { type: 'badge', label: 'Optimal Load', color: 'bg-secondary text-white' },
      { type: 'event', time: '09:00', title: 'Recovery Session', sub: 'Main Pitch · 90m', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 2, events: [
      { type: 'event', time: '14:00', title: 'Tactical Review', sub: 'Video Room', color: 'border-l-4 border-tertiary-container bg-tertiary-container/20 text-on-surface' },
    ]},
    { day: 3, events: [
      { type: 'badge', label: '✦ AI Recommended', color: 'bg-[#F97316] text-white' },
      { type: 'event', time: '', title: 'Recommended Rest', sub: 'High Fatigue Index detected in Midfield core.', color: 'bg-[#FEF3EA] border border-[#F97316]/30 text-on-surface' },
    ]},
    { day: 4, events: [] },
    { day: 5, weekend: true, events: [
      { type: 'badge', label: 'MATCH DAY', color: 'bg-inverse-surface text-white' },
      { type: 'event', time: '10:00', title: 'High-Intensity', sub: 'Physical Training', color: 'bg-primary text-white' },
      { type: 'event', time: '15:00', title: 'vs Man City', sub: 'Etihad Stadium (A)', color: 'bg-inverse-surface text-white' },
    ]},
    { day: 6, weekend: true, events: [] },
  ],
  [
    { day: 7, events: [
      { type: 'event', time: '11:00', title: 'Tactical Analysis', sub: '', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 8, events: [] },
    { day: 9, events: [
      { type: 'event', time: '09:30', title: 'Gym Session', sub: '', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 10, events: [
      { type: 'event', time: '', title: 'Outdoor Drill - Finishing', sub: '', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' },
    ]},
    { day: 11, events: [] },
    { day: 12, weekend: true, events: [] },
    { day: 13, weekend: true, events: [] },
  ],
  [
    { day: 14, events: [
      { type: 'event', time: '10:00', title: 'Set Piece Training', sub: 'Main Pitch', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 15, events: [] },
    { day: 16, events: [
      { type: 'event', time: '09:00', title: 'Strength & Conditioning', sub: 'Gym', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 17, events: [
      { type: 'badge', label: '✦ AI Recommended', color: 'bg-[#F97316] text-white' },
      { type: 'event', time: '', title: 'Light Recovery', sub: 'Pre-match protocol', color: 'bg-[#FEF3EA] border border-[#F97316]/30 text-on-surface' },
    ]},
    { day: 18, events: [] },
    { day: 19, weekend: true, events: [
      { type: 'badge', label: 'MATCH DAY', color: 'bg-inverse-surface text-white' },
      { type: 'event', time: '17:00', title: 'vs Arsenal', sub: 'Home · Emirates', color: 'bg-inverse-surface text-white' },
    ]},
    { day: 20, weekend: true, events: [] },
  ],
  [
    { day: 21, events: [] },
    { day: 22, events: [
      { type: 'event', time: '10:30', title: 'Tactical Debrief', sub: 'Video Room', color: 'border-l-4 border-tertiary-container bg-tertiary-container/20 text-on-surface' },
    ]},
    { day: 23, events: [
      { type: 'event', time: '09:00', title: 'Pressing Drills', sub: 'Pitch 2', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 24, events: [] },
    { day: 25, events: [
      { type: 'event', time: '11:00', title: 'Squad Assessment', sub: 'Medical Wing', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' },
    ]},
    { day: 26, weekend: true, events: [] },
    { day: 27, weekend: true, events: [] },
  ],
  [
    { day: 28, events: [
      { type: 'event', time: '09:00', title: 'Pre-Match Training', sub: 'Main Pitch · 60m', color: 'border-l-4 border-primary bg-primary/10 text-primary' },
    ]},
    { day: 29, events: [] },
    { day: 30, events: [
      { type: 'event', time: '10:00', title: 'Activation Session', sub: 'Pitch 1', color: 'border-l-4 border-secondary bg-secondary/10 text-secondary' },
    ]},
    { day: 31, events: [] },
    { day: 1, outside: true, events: [] },
    { day: 2, outside: true, weekend: true, events: [] },
    { day: 3, outside: true, weekend: true, events: [] },
  ],
];

const upcomingEvents = [
  { day: '05', month: 'OCT', title: 'Manchester City (A)', sub: 'Etihad Stadium', icon: MapPin },
  { day: '08', month: 'OCT', title: 'Squad Bio-Assessment', sub: 'Medical Wing', icon: Building2 },
  { day: '12', month: 'OCT', title: 'Pre-Match Press', sub: 'Media Center', icon: Mic },
];

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function CalendrierPage() {
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month');

  return (
    <div className="flex gap-6 h-full min-h-0">

      {/* ── Calendrier ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-5 flex-wrap shrink-0">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            October<br />2024
          </h1>

          <div className="flex bg-surface-container rounded-xl p-1 gap-1">
            {(['Month', 'Week', 'Day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  view === v ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button className="px-4 py-2 rounded-xl border border-outline-variant text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
              Today
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Download size={18} /> Export Schedule
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-colors">
              <Plus size={18} /> Add Event
            </button>
          </div>
        </div>

        {/* Grille */}
        <div className="flex-1 min-h-0 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col">

          {/* En-têtes */}
          <div className="grid grid-cols-7 border-b border-outline-variant shrink-0">
            {days.map((day, i) => (
              <div key={day} className={`py-3 text-center text-sm font-bold uppercase tracking-widest ${i >= 5 ? 'text-primary' : 'text-on-surface-variant'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Semaines */}
          <div className="flex-1 min-h-0 flex flex-col">
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className={`grid grid-cols-7 flex-1 ${wi < weeks.length - 1 ? 'border-b border-outline-variant' : ''}`}
              >
                {week.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`p-2.5 flex flex-col gap-1.5 overflow-hidden ${ci < 6 ? 'border-r border-outline-variant' : ''} ${cell.outside ? 'bg-surface-container/40' : ''}`}
                  >
                    <p className={`text-sm font-bold ${
                      cell.outside ? 'text-on-surface-variant/30' :
                      cell.weekend ? 'text-primary' :
                      'text-on-surface'
                    }`}>
                      {cell.day}
                    </p>
                    {cell.events.map((event, ei) => (
                      <div key={ei}>
                        {event.type === 'badge' ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${event.color}`}>
                            {event.label}
                          </span>
                        ) : (
                          <div className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity ${event.color}`}>
                            {event.time && <p className="font-bold">{event.time}</p>}
                            <p className="font-semibold leading-tight">{event.title}</p>
                            {event.sub && <p className="opacity-75 leading-tight">{event.sub}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="w-80 shrink-0 space-y-5 overflow-y-auto">

        {/* Upcoming Events */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-on-surface">Upcoming Events</p>
            <button className="text-base font-semibold text-primary hover:underline">See all</button>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event, i) => {
              const Icon = event.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-primary rounded-xl px-2 py-1.5 text-center shrink-0">
                    <p className="text-xs font-bold text-white/70 uppercase">{event.month}</p>
                    <p className="text-xl font-extrabold text-white leading-tight">{event.day}</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-on-surface">{event.title}</p>
                    <div className="flex items-center gap-1 text-sm text-on-surface-variant mt-0.5">
                      <Icon size={13} /> {event.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Availability */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-on-surface">Team Availability</p>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
              <Info size={18} className="text-on-surface-variant" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-4xl font-extrabold text-secondary leading-none">24/28</p>
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Players Match Fit</p>
            </div>
            <div className="ml-auto">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="#006e2d" strokeWidth="6"
                  strokeDasharray={`${(24 / 28) * 150} 150`} strokeLinecap="round" transform="rotate(-90 30 30)" />
              </svg>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { label: 'Ready for Selection', value: 24, color: 'bg-secondary' },
              { label: 'Questionable', value: 2, color: 'bg-[#F97316]' },
              { label: 'Injured/Unavailable', value: 2, color: 'bg-error' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-on-surface-variant">{item.label}</span>
                </div>
                <span className="font-bold text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#F97316]/30 border-l-4 border-l-[#F97316] p-4" style={{ background: '#FEF3EA' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={14} className="text-[#F97316]" />
              <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest">AI Recommendation</p>
            </div>
            <p className="text-base font-bold text-on-surface mb-1">Rotate Squad for Saturday</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              High workload detected in 4 key players. Recommend resting K. De Bruyne for the mid-week cup session.
            </p>
          </div>
        </div>

        {/* Load Analysis */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <p className="text-lg font-bold text-on-surface mb-4">Load Analysis</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-base text-on-surface">Cardiovascular Load</span>
                <span className="text-base font-bold text-secondary">Optimal</span>
              </div>
              <div className="h-2.5 bg-surface-container rounded-full">
                <div className="h-2.5 bg-secondary rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-base text-on-surface">Muscle Strain Avg.</span>
                <span className="text-base font-bold text-[#F97316]">Warning</span>
              </div>
              <div className="h-2.5 bg-surface-container rounded-full">
                <div className="h-2.5 bg-[#F97316] rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}