'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Video, Leaf, Dumbbell, Users, Trophy, Plus, X, Pencil, Trash2, MapPin, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT } from '@/contexts/LanguageContext';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const DAYS_SHORT = ['LUN','MAR','MER','JEU','VEN','SAM','DIM'];
const MINI_DAYS  = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

type MobileEvent = {
  id?: number;
  time: string;
  title: string;
  tag: EventTag;
  border: string;
  IconComp: LucideIcon;
  iconColor: string;
  iconBg: string;
  lieu?: string;
  remarques?: string;
  isMatch?: boolean;
};

type DetailInfo = {
  event: MobileEvent;
  dayLabel: string;
  dateStr: string;
};

const TAGS: EventTag[] = ['Match', 'Entraînement', 'Récupération', 'Réunion'];

const TAG_ACTIVE: Record<EventTag, string> = {
  'Match':        'bg-error/10 text-error border-error',
  'Entraînement': 'bg-primary/10 text-primary border-primary',
  'Récupération': 'bg-secondary/10 text-secondary border-secondary',
  'Réunion':      'bg-surface-container text-on-surface border-outline',
};

const TAG_HOVER: Record<EventTag, string> = {
  'Match':        'hover:text-error hover:border-error',
  'Entraînement': 'hover:text-primary hover:border-primary',
  'Récupération': 'hover:text-secondary hover:border-secondary',
  'Réunion':      'hover:text-on-surface hover:border-outline',
};

function getCalGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const grid: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(d);
  return grid;
}

const TAG_MOBILE: Record<EventTag, { border: string; IconComp: LucideIcon; iconColor: string; iconBg: string }> = {
  'Match':        { border: 'border-l-error',     IconComp: Trophy,   iconColor: 'text-error',     iconBg: 'bg-error/10' },
  'Entraînement': { border: 'border-l-primary',   IconComp: Dumbbell, iconColor: 'text-primary',   iconBg: 'bg-primary/10' },
  'Récupération': { border: 'border-l-secondary', IconComp: Leaf,     iconColor: 'text-secondary', iconBg: 'bg-secondary/10' },
  'Réunion':      { border: 'border-l-primary',   IconComp: Video,    iconColor: 'text-primary',   iconBg: 'bg-primary/10' },
};

const EVENT_POOLS: MobileEvent[][] = [
  [
    { time: '09:30', title: 'Séance Vidéo',          tag: 'Réunion',      border: 'border-l-primary',   IconComp: Video,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle vidéo · Bâtiment B' },
    { time: '14:00', title: 'Entraînement Physique', tag: 'Entraînement', border: 'border-l-secondary', IconComp: Dumbbell, iconColor: 'text-secondary', iconBg: 'bg-secondary/10', lieu: 'Terrain principal', remarques: 'Séance longue 90 min. Tenue complète obligatoire.' },
  ],
  [
    { time: '10:00', title: 'Récupération Active',   tag: 'Récupération', border: 'border-l-secondary', IconComp: Leaf,     iconColor: 'text-secondary', iconBg: 'bg-secondary/10', lieu: 'Centre aquatique', remarques: 'Cryothérapie puis massage. Prévoir affaires de bain.' },
    { time: '15:30', title: 'Réunion Tactique',      tag: 'Réunion',      border: 'border-l-primary',   IconComp: Users,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle de conférence A' },
  ],
  [
    { time: '08:00', title: 'Gym — Force & Cardio',  tag: 'Entraînement', border: 'border-l-primary',   IconComp: Dumbbell, iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle de musculation', remarques: 'Cycle force semaine 3. Suivre le programme affiché.' },
  ],
  [
    { time: '11:00', title: 'Analyse Adversaire',    tag: 'Réunion',      border: 'border-l-primary',   IconComp: Video,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle vidéo · Bâtiment B', remarques: 'Présence obligatoire. Supports imprimés disponibles à l\'entrée.' },
    { time: '17:00', title: 'Match vs Arsenal',      tag: 'Match',        border: 'border-l-error',     IconComp: Trophy,   iconColor: 'text-error',     iconBg: 'bg-error/10',     lieu: 'Stade principal (domicile)', remarques: 'Échauffement 16h00. Accueil presse 14h30.', isMatch: true },
  ],
  [
    { time: '09:00', title: 'Pressing Drills',       tag: 'Entraînement', border: 'border-l-secondary', IconComp: Leaf,     iconColor: 'text-secondary', iconBg: 'bg-secondary/10', lieu: 'Terrain 2' },
    { time: '14:00', title: 'Bilan Médical Équipe',  tag: 'Récupération', border: 'border-l-primary',   IconComp: Users,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Aile médicale', remarques: 'Évaluation physique trimestrielle. Prévoir 45 min par joueur.' },
  ],
  [
    { time: '10:30', title: 'Débrief Vidéo',         tag: 'Réunion',      border: 'border-l-primary',   IconComp: Video,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle vidéo · Bâtiment B' },
  ],
  [
    { time: '09:00', title: 'Séance Cardio Légère',  tag: 'Entraînement', border: 'border-l-secondary', IconComp: Dumbbell, iconColor: 'text-secondary', iconBg: 'bg-secondary/10', lieu: "Terrain d'entraînement" },
    { time: '16:00', title: 'Tactique Défensive',    tag: 'Réunion',      border: 'border-l-primary',   IconComp: Users,    iconColor: 'text-primary',   iconBg: 'bg-primary/10',   lieu: 'Salle vidéo + Terrain', remarques: 'Session mixte vidéo + terrain. Défenseurs et milieux défensifs.' },
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
    return { dayIndex: i, date: d.getDate(), month: d.getMonth(), year: d.getFullYear(), key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` };
  });
}

function getWeekLabel(days: ReturnType<typeof getWeekDays>, months: readonly string[]) {
  const first = days[0]; const last = days[6];
  if (first.month === last.month) return `${months[first.month]} ${first.year}`;
  return `${months[first.month]} — ${months[last.month]} ${last.year}`;
}

export default function CalendrierMobile({ openCreate = false, openEventId }: { openCreate?: boolean; openEventId?: number }) {
  const today = new Date();
  const baseMondayRef = getMondayOfWeek(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const [activeKey, setActiveKey] = useState(todayKey);

  const [detailInfo, setDetailInfo] = useState<DetailInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [editEvent, setEditEvent] = useState<MobileEvent | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', tag: 'Entraînement' as EventTag,
    lieu: '', remarques: '',
    day: 1, month: 0, year: today.getFullYear(),
    hour: 9, minute: 0,
  });
  const [editCalMonth, setEditCalMonth] = useState(today.getMonth());
  const [editCalYear, setEditCalYear] = useState(today.getFullYear());

  const [createOpen,    setCreateOpen]    = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', tag: 'Entraînement' as EventTag,
    lieu: '', remarques: '',
    day: today.getDate(), month: today.getMonth(), year: today.getFullYear(),
    hour: 10, minute: 0,
  });
  const [createCalMonth, setCreateCalMonth] = useState(today.getMonth());
  const [createCalYear,  setCreateCalYear]  = useState(today.getFullYear());

  const [eventsMap, setEventsMap] = useState<Record<string, MobileEvent[]>>({});
  const pendingEventIdRef = useRef<number | null>(openEventId ?? null);

  const { isAdmin: canEdit, type: userType } = useCurrentUser();
  const canCreate = userType !== 'player';
  const t = useT();

  const pad = (n: number) => String(n).padStart(2, '0');

  const weekDays = getWeekDays(baseMondayRef, weekOffset);
  const activeEvents = eventsMap[activeKey] ?? getEventsForKey(activeKey);

  const fetchEventsForMonth = useCallback(async (year: number, month: number) => {
    const res = await fetch(`/api/backend/events?year=${year}&month=${month + 1}`);
    if (!res.ok) return;
    const events = await res.json();
    setEventsMap(prev => {
      const next = { ...prev };
      for (const e of events) {
        const [y, m, d] = e.event_date.split('-').map(Number);
        const key = `${y}-${m - 1}-${d}`;
        const tm = TAG_MOBILE[e.tag as EventTag] ?? TAG_MOBILE['Réunion'];
        if (!next[key]) next[key] = [];
        if (!next[key].some(ev => ev.id === e.id)) {
          next[key] = [...next[key], { id: e.id, time: e.event_time, title: e.title, tag: e.tag as EventTag, ...tm, lieu: e.location ?? undefined, remarques: e.notes ?? undefined, isMatch: e.tag === 'Match' }];
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const months = new Set(weekDays.map(d => `${d.year}-${d.month}`));
    months.forEach(m => {
      const [y, mo] = m.split('-').map(Number);
      fetchEventsForMonth(y, mo);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, fetchEventsForMonth]);

  const getActiveDateObj = () => {
    const parts = activeKey.split('-').map(Number);
    return new Date(parts[0], parts[1], parts[2]);
  };

  const openDetail = (event: MobileEvent) => {
    const d = getActiveDateObj();
    const dayLabel = `${t.calendar.fullDays[d.getDay()]} ${d.getDate()} ${t.calendar.months[d.getMonth()]} ${d.getFullYear()}`;
    setDetailInfo({ event, dayLabel, dateStr: event.time });
    setTimeout(() => setDetailVisible(true), 10);
  };
  const closeDetail = () => { setDetailVisible(false); setTimeout(() => setDetailInfo(null), 200); };

  const openEdit = (event: MobileEvent) => {
    const [h, m] = event.time.split(':').map(Number);
    const d = getActiveDateObj();
    setEditForm({ title: event.title, tag: event.tag, lieu: event.lieu ?? '', remarques: event.remarques ?? '', day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), hour: h, minute: m });
    setEditCalMonth(d.getMonth());
    setEditCalYear(d.getFullYear());
    setEditEvent(event);
    setTimeout(() => setEditVisible(true), 10);
  };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => setEditEvent(null), 200); };

  const openEditFromDetail = () => {
    if (!detailInfo) return;
    setDetailVisible(false);
    const ev = detailInfo.event;
    setTimeout(() => { setDetailInfo(null); openEdit(ev); }, 200);
  };

  const prevEditCal = () => {
    if (editCalMonth === 0) { setEditCalMonth(11); setEditCalYear(y => y - 1); }
    else setEditCalMonth(m => m - 1);
  };
  const nextEditCal = () => {
    if (editCalMonth === 11) { setEditCalMonth(0); setEditCalYear(y => y + 1); }
    else setEditCalMonth(m => m + 1);
  };

  const openCreateForm = () => {
    const now = new Date();
    setCreateForm({ title: '', tag: 'Entraînement', lieu: '', remarques: '', day: now.getDate(), month: now.getMonth(), year: now.getFullYear(), hour: 10, minute: 0 });
    setCreateCalMonth(now.getMonth());
    setCreateCalYear(now.getFullYear());
    setCreateOpen(true);
    setTimeout(() => setCreateVisible(true), 10);
  };
  const closeCreateForm = () => { setCreateVisible(false); setTimeout(() => setCreateOpen(false), 200); };
  const prevCreateCal = () => { if (createCalMonth === 0) { setCreateCalMonth(11); setCreateCalYear(y => y - 1); } else setCreateCalMonth(m => m - 1); };
  const nextCreateCal = () => { if (createCalMonth === 11) { setCreateCalMonth(0); setCreateCalYear(y => y + 1); } else setCreateCalMonth(m => m + 1); };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openCreate) openCreateForm(); }, []);

  // Navigate to the right week when openEventId is provided
  useEffect(() => {
    if (!openEventId) return;
    fetch(`/api/backend/events/${openEventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(evt => {
        if (!evt) return;
        const [y, m, d] = evt.event_date.split('-').map(Number);
        const eventDate = new Date(y, m - 1, d);
        const eventMonday = getMondayOfWeek(eventDate);
        const offset = Math.round((eventMonday.getTime() - baseMondayRef.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const key = `${y}-${m - 1}-${d}`;
        pendingEventIdRef.current = openEventId;
        setWeekOffset(offset);
        setActiveKey(key);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once eventsMap updates, open the pending event detail
  useEffect(() => {
    const targetId = pendingEventIdRef.current;
    if (targetId === null) return;
    const evts = eventsMap[activeKey];
    if (!evts) return;
    const evt = evts.find(e => e.id === targetId);
    if (evt) {
      pendingEventIdRef.current = null;
      const parts = activeKey.split('-').map(Number);
      const d = new Date(parts[0], parts[1], parts[2]);
      const dayLabel = `${t.calendar.fullDays[d.getDay()]} ${d.getDate()} ${t.calendar.months[d.getMonth()]} ${d.getFullYear()}`;
      setDetailInfo({ event: evt, dayLabel, dateStr: evt.time });
      setTimeout(() => setDetailVisible(true), 10);
    }
  }, [eventsMap, activeKey, t]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">{t.nav.calendar}</h1>
        {canCreate && (
          <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2.5 bg-error rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-all">
            + {t.calendar.addEvent}
          </button>
        )}
      </div>

      {/* Navigation semaine */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
            <ChevronLeft size={20} className="text-on-surface-variant" />
          </button>
          <p className="text-base font-bold text-on-surface uppercase tracking-wider">{getWeekLabel(weekDays, t.calendar.months)}</p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const isActive = d.key === activeKey;
            const hasMatch = getEventsForKey(d.key).some(e => e.isMatch);
            return (
              <button key={d.key} onClick={() => setActiveKey(d.key)}
                className={`flex flex-col items-center py-3 px-1 rounded-2xl transition-all ${isActive ? (hasMatch ? 'bg-error text-white shadow-md' : 'bg-primary text-white shadow-md') : hasMatch ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${isActive ? 'text-white/70' : hasMatch ? 'text-error/60' : 'text-on-surface-variant'}`}>{t.calendar.days[d.dayIndex]}</span>
                <span className="text-lg font-extrabold leading-tight">{d.date}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Événements du jour */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-on-surface">{t.calendar.eventsPlural}</h2>
          <span className="text-base font-semibold text-on-surface-variant">{activeEvents.length} {activeEvents.length > 1 ? t.calendar.eventsPlural : t.calendar.events}</span>
        </div>
        {activeEvents.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-8 text-center">
            <p className="text-base text-on-surface-variant">{t.calendar.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeEvents.map((event, i) => {
              const Icon = event.IconComp;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0 w-14">
                    <span className="text-base font-bold text-on-surface">{event.time}</span>
                    {i < activeEvents.length - 1 && <div className="w-px flex-1 bg-outline-variant mt-2 min-h-[60px]" />}
                  </div>
                  <div onClick={() => openDetail(event)}
                    className={`flex-1 border border-outline-variant border-l-4 ${event.border} rounded-2xl p-4 mb-2 cursor-pointer ${event.isMatch ? 'bg-error/5' : 'bg-surface-container-low'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-xl font-bold flex-1 min-w-0 ${event.isMatch ? 'text-error' : 'text-on-surface'}`}>{event.title}</p>
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

      {/* ── Modal détail (lecture seule) ── */}
      {detailInfo && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${detailVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeDetail} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-200 ${detailVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-start justify-between px-7 pt-7 pb-4">
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${TAG_ACTIVE[detailInfo.event.tag]}`}>{detailInfo.event.tag}</span>
                <button onClick={closeDetail} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="px-7 pb-7 space-y-6">
                <p className="text-2xl font-extrabold text-on-surface leading-tight">{detailInfo.event.title}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-primary shrink-0" />
                    <span className="text-base font-semibold text-on-surface">{detailInfo.dayLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-primary shrink-0" />
                    <span className="text-base font-semibold text-on-surface">{detailInfo.dateStr}</span>
                  </div>
                  {detailInfo.event.lieu && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                      <span className="text-base text-on-surface-variant">{detailInfo.event.lieu}</span>
                    </div>
                  )}
                </div>

                {detailInfo.event.remarques && (
                  <div className="bg-surface-container rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <FileText size={14} className="text-on-surface-variant" />
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.calendar.fieldNotes}</p>
                    </div>
                    <p className="text-base text-on-surface leading-relaxed">{detailInfo.event.remarques}</p>
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="px-7 py-4 border-t border-outline-variant shrink-0 flex justify-end">
                  <button
                    onClick={openEditFromDetail}
                    className="flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl font-semibold transition-colors"
                  >
                    <Pencil size={15} /> Modifier
                  </button>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* ── Modal édition ── */}
      {editEvent && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.calendar.editEvent}</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Titre */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldTitle}</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldType}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAGS.map(tag => (
                      <button key={tag} onClick={() => setEditForm(f => ({ ...f, tag }))}
                        className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${editForm.tag === tag ? TAG_ACTIVE[tag] : `bg-surface-container text-on-surface-variant border-outline-variant ${TAG_HOVER[tag]}`}`}>
                        {t.calendar.tags[tag]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldDate}</label>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevEditCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                      <ChevronLeft size={16} className="text-on-surface-variant" />
                    </button>
                    <span className="text-sm font-bold text-on-surface">{t.calendar.months[editCalMonth]} {editCalYear}</span>
                    <button onClick={nextEditCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                      <ChevronRight size={16} className="text-on-surface-variant" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {t.calendar.miniDays.map(d => <div key={d} className="text-center text-xs font-bold text-on-surface-variant py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getCalGrid(editCalYear, editCalMonth).map((day, i) => {
                      const isSelected = day !== null && day === editForm.day && editCalMonth === editForm.month && editCalYear === editForm.year;
                      return (
                        <button key={i} disabled={day === null}
                          onClick={() => day && setEditForm(f => ({ ...f, day, month: editCalMonth, year: editCalYear }))}
                          className={`h-9 w-full rounded-lg text-sm font-semibold transition-all ${!day ? 'invisible' : isSelected ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface'}`}>
                          {day || ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Heure */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldHour}</label>
                  <div className="flex items-center justify-center gap-4 bg-surface-container rounded-2xl py-4">
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setEditForm(f => ({ ...f, hour: (f.hour + 1) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                        <ChevronUp size={18} className="text-on-surface-variant" />
                      </button>
                      <span className="text-3xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(editForm.hour).padStart(2, '0')}</span>
                      <button onClick={() => setEditForm(f => ({ ...f, hour: (f.hour - 1 + 24) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                        <ChevronDown size={18} className="text-on-surface-variant" />
                      </button>
                    </div>
                    <span className="text-3xl font-extrabold text-on-surface-variant mb-1">:</span>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setEditForm(f => ({ ...f, minute: (f.minute + 5) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                        <ChevronUp size={18} className="text-on-surface-variant" />
                      </button>
                      <span className="text-3xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(editForm.minute).padStart(2, '0')}</span>
                      <button onClick={() => setEditForm(f => ({ ...f, minute: (f.minute - 5 + 60) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                        <ChevronDown size={18} className="text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lieu */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldLocation} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span></label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" value={editForm.lieu} onChange={e => setEditForm(f => ({ ...f, lieu: e.target.value }))}
                      placeholder={t.calendar.fieldLocationPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                  </div>
                </div>

                {/* Remarques */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldNotes} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span></label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-3.5 text-on-surface-variant" />
                    <textarea value={editForm.remarques} onChange={e => setEditForm(f => ({ ...f, remarques: e.target.value }))}
                      rows={3} placeholder={t.calendar.fieldNotesPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline resize-none" />
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant shrink-0">
                <button onClick={async () => {
                  if (!editEvent?.id) return;
                  await fetch(`/api/backend/events/${editEvent.id}`, { method: 'DELETE' });
                  setEventsMap(prev => {
                    const next = { ...prev };
                    for (const key of Object.keys(next)) next[key] = next[key].filter(e => e.id !== editEvent.id);
                    return next;
                  });
                  closeEdit(); closeDetail();
                }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold">
                  <Trash2 size={16} /> {t.common.delete}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                  <button onClick={async () => {
                    if (!editEvent?.id) return;
                    await fetch(`/api/backend/events/${editEvent.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: editForm.title, tag: editForm.tag, event_date: `${editForm.year}-${pad(editForm.month + 1)}-${pad(editForm.day)}`, event_time: `${pad(editForm.hour)}:${pad(editForm.minute)}`, location: editForm.lieu || null, notes: editForm.remarques || null }),
                    });
                    await fetchEventsForMonth(editForm.year, editForm.month); closeEdit();
                  }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Modal création ── */}
      {createOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${createVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeCreateForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.calendar.createEvent}</p>
                <button onClick={closeCreateForm} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldTitle}</label>
                  <input type="text" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={t.calendar.fieldTitlePlaceholder}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldType}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAGS.map(tag => (
                      <button key={tag} onClick={() => setCreateForm(f => ({ ...f, tag }))}
                        className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${createForm.tag === tag ? TAG_ACTIVE[tag] : `bg-surface-container text-on-surface-variant border-outline-variant ${TAG_HOVER[tag]}`}`}>
                        {t.calendar.tags[tag]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldDate}</label>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevCreateCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"><ChevronLeft size={16} className="text-on-surface-variant" /></button>
                    <span className="text-sm font-bold text-on-surface">{t.calendar.months[createCalMonth]} {createCalYear}</span>
                    <button onClick={nextCreateCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"><ChevronRight size={16} className="text-on-surface-variant" /></button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {t.calendar.miniDays.map(d => <div key={d} className="text-center text-xs font-bold text-on-surface-variant py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getCalGrid(createCalYear, createCalMonth).map((day, i) => {
                      const sel = day !== null && day === createForm.day && createCalMonth === createForm.month && createCalYear === createForm.year;
                      return (
                        <button key={i} disabled={day === null}
                          onClick={() => day && setCreateForm(f => ({ ...f, day, month: createCalMonth, year: createCalYear }))}
                          className={`h-9 w-full rounded-lg text-sm font-semibold transition-all ${!day ? 'invisible' : sel ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface'}`}>
                          {day || ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldHour}</label>
                  <div className="flex items-center justify-center gap-4 bg-surface-container rounded-2xl py-4">
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setCreateForm(f => ({ ...f, hour: (f.hour + 1) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronUp size={18} className="text-on-surface-variant" /></button>
                      <span className="text-3xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(createForm.hour).padStart(2, '0')}</span>
                      <button onClick={() => setCreateForm(f => ({ ...f, hour: (f.hour - 1 + 24) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronDown size={18} className="text-on-surface-variant" /></button>
                    </div>
                    <span className="text-3xl font-extrabold text-on-surface-variant mb-1">:</span>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setCreateForm(f => ({ ...f, minute: (f.minute + 5) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronUp size={18} className="text-on-surface-variant" /></button>
                      <span className="text-3xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(createForm.minute).padStart(2, '0')}</span>
                      <button onClick={() => setCreateForm(f => ({ ...f, minute: (f.minute - 5 + 60) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronDown size={18} className="text-on-surface-variant" /></button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldLocation} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span></label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" value={createForm.lieu} onChange={e => setCreateForm(f => ({ ...f, lieu: e.target.value }))}
                      placeholder={t.calendar.fieldLocationPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldNotes} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span></label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-3.5 text-on-surface-variant" />
                    <textarea value={createForm.remarques} onChange={e => setCreateForm(f => ({ ...f, remarques: e.target.value }))}
                      rows={3} placeholder={t.calendar.fieldNotesPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline resize-none" />
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeCreateForm} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={async () => {
                  if (!createForm.title.trim()) return;
                  await fetch('/api/backend/events', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: createForm.title, tag: createForm.tag, event_date: `${createForm.year}-${pad(createForm.month + 1)}-${pad(createForm.day)}`, event_time: `${pad(createForm.hour)}:${pad(createForm.minute)}`, location: createForm.lieu || null, notes: createForm.remarques || null }),
                  });
                  await fetchEventsForMonth(createForm.year, createForm.month); closeCreateForm();
                }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.add}</button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
