'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, X, Pencil, Trash2, MapPin, FileText } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT } from '@/contexts/LanguageContext';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

type CalEvent = {
  id?: number;
  time: string;
  title: string;
  tag: EventTag;
  color: string;
  lieu?: string;
  remarques?: string;
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

type DetailInfo = {
  event: CalEvent;
  day: number;
  month: number;
  year: number;
};

const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const DAYS      = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const MINI_DAYS = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
const MAX_VISIBLE = 2;

const TAG_COLOR: Record<EventTag, string> = {
  'Match':        'bg-error text-white',
  'Entraînement': 'border-l-4 border-primary bg-primary/10 text-primary',
  'Récupération': 'border-l-4 border-secondary bg-secondary/10 text-secondary',
  'Réunion':      'border-l-4 border-outline bg-surface-container text-on-surface',
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

const TAG_BADGE: Record<EventTag, string> = {
  'Match':        'bg-black/10',
  'Entraînement': 'bg-black/10',
  'Récupération': 'bg-black/10',
  'Réunion':      'bg-surface-container-high text-on-surface-variant',
};

function getCalGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const grid: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(d);
  return grid;
}


function generateWeeks(year: number, month: number, eventsMap: Record<number, CalEvent[]>): CalCell[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
  const weeks: CalCell[][] = [];
  let week: CalCell[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = new Date(year, month, -(firstDayOfWeek - 1 - i));
    week.push({ day: d.getDate(), outside: true, weekend: d.getDay() === 0 || d.getDay() === 6, events: [] });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dayEvents = eventsMap[d] ?? [];
    week.push({ day: d, outside: false, weekend: date.getDay() === 0 || date.getDay() === 6, isMatch: dayEvents.some(e => e.tag === 'Match'), events: dayEvents });
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

export default function CalendrierDesktop({ openCreate = false, openEventId }: { openCreate?: boolean; openEventId?: number }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dayDetail, setDayDetail]       = useState<DayDetail | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [detailInfo, setDetailInfo]     = useState<DetailInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editEvent, setEditEvent]       = useState<CalEvent | null>(null);
  const [editVisible, setEditVisible]   = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', tag: 'Entraînement' as EventTag,
    lieu: '', remarques: '',
    day: 1, month: today.getMonth(), year: today.getFullYear(),
    hour: 9, minute: 0,
  });
  const [editCalMonth, setEditCalMonth] = useState(today.getMonth());
  const [editCalYear,  setEditCalYear]  = useState(today.getFullYear());

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

  const [eventsMap, setEventsMap] = useState<Record<number, CalEvent[]>>({});
  const pendingEventIdRef = useRef<number | null>(openEventId ?? null);

  const { isAdmin: canEdit, type: userType } = useCurrentUser();
  const canCreate = userType !== 'player';
  const t = useT();

  const fetchEvents = useCallback(async () => {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const res = await fetch(`/api/backend/events?year=${year}&month=${month}`);
    if (!res.ok) return;
    const events = await res.json();
    const map: Record<number, CalEvent[]> = {};
    for (const e of events) {
      const day = parseInt(e.event_date.split('-')[2]);
      if (!map[day]) map[day] = [];
      map[day].push({ id: e.id, time: e.event_time, title: e.title, tag: e.tag as EventTag, color: TAG_COLOR[e.tag as EventTag], lieu: e.location ?? undefined, remarques: e.notes ?? undefined });
    }
    setEventsMap(map);
  }, [current]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Navigate to the right month when openEventId is provided
  useEffect(() => {
    if (!openEventId) return;
    fetch(`/api/backend/events/${openEventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(evt => {
        if (!evt) return;
        const [y, m] = evt.event_date.split('-').map(Number);
        pendingEventIdRef.current = openEventId;
        setCurrent(new Date(y, m - 1, 1));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once eventsMap updates, open the pending event detail
  useEffect(() => {
    const targetId = pendingEventIdRef.current;
    if (targetId === null) return;
    for (const [dayStr, evts] of Object.entries(eventsMap)) {
      const evt = evts.find(e => e.id === targetId);
      if (evt) {
        pendingEventIdRef.current = null;
        setDetailInfo({ event: evt, day: Number(dayStr), month: current.getMonth(), year: current.getFullYear() });
        setTimeout(() => setDetailVisible(true), 10);
        break;
      }
    }
  }, [eventsMap, current]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const prev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const next = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const openPanel = (cell: CalCell) => {
    setDayDetail({ day: cell.day, month: current.getMonth(), year: current.getFullYear(), events: cell.events });
    setTimeout(() => setPanelVisible(true), 10);
  };
  const closePanel = () => { setPanelVisible(false); setTimeout(() => setDayDetail(null), 300); };

  const openDetail = (event: CalEvent, day: number) => {
    setDetailInfo({ event, day, month: current.getMonth(), year: current.getFullYear() });
    setTimeout(() => setDetailVisible(true), 10);
  };
  const closeDetail = () => { setDetailVisible(false); setTimeout(() => setDetailInfo(null), 200); };

  const openEdit = (event: CalEvent, day: number) => {
    const [h, m] = event.time.split(':').map(Number);
    setEditForm({ title: event.title, tag: event.tag, lieu: event.lieu ?? '', remarques: event.remarques ?? '', day, month: current.getMonth(), year: current.getFullYear(), hour: h, minute: m });
    setEditCalMonth(current.getMonth());
    setEditCalYear(current.getFullYear());
    setEditEvent(event);
    setTimeout(() => setEditVisible(true), 10);
  };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => setEditEvent(null), 200); };

  const prevEditCal = () => { if (editCalMonth === 0) { setEditCalMonth(11); setEditCalYear(y => y - 1); } else setEditCalMonth(m => m - 1); };
  const nextEditCal = () => { if (editCalMonth === 11) { setEditCalMonth(0); setEditCalYear(y => y + 1); } else setEditCalMonth(m => m + 1); };

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

  const weeks = generateWeeks(current.getFullYear(), current.getMonth(), eventsMap);

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors shrink-0"><ChevronLeft size={16} /></button>
        <h1 className="text-xl font-extrabold text-on-surface tracking-tight whitespace-nowrap">
          {t.calendar.months[current.getMonth()]} {current.getFullYear()}
        </h1>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors shrink-0"><ChevronRight size={16} /></button>
        {canCreate && (
          <div className="ml-auto shrink-0">
            <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/90 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={16} /> {t.calendar.addEvent}
            </button>
          </div>
        )}
      </div>

      {/* Calendrier + panneau */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Grille */}
        <div className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-outline-variant shrink-0">
            {t.calendar.days.map((day, i) => (
              <div key={day} className={`py-2 text-center text-xs font-bold uppercase tracking-widest ${i >= 5 ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</div>
            ))}
          </div>
          <div
            className="flex-1 min-h-0"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}
          >
            {weeks.flat().map((cell, i) => {
              const col     = i % 7;
              const row     = Math.floor(i / 7);
              const visible = cell.events.slice(0, MAX_VISIBLE);
              const hidden  = cell.events.length - MAX_VISIBLE;
              const isLastCol = col === 6;
              const isLastRow = row === weeks.length - 1;
              return (
                <div key={i} className={`p-2 flex flex-col gap-1 overflow-hidden ${!isLastCol ? 'border-r border-outline-variant' : ''} ${!isLastRow ? 'border-b border-outline-variant' : ''} ${cell.outside ? 'bg-surface-container/40' : cell.isMatch ? 'bg-error/5' : ''}`}>
                  <div className="flex items-center justify-between shrink-0">
                    <p className={`text-sm font-bold ${cell.outside ? 'text-on-surface-variant/30' : cell.isMatch ? 'text-error' : cell.weekend ? 'text-primary' : 'text-on-surface'}`}>{cell.day}</p>
                    {cell.isMatch && !cell.outside && <span className="text-[10px] font-bold text-error uppercase tracking-wide">{t.calendar.matchDay}</span>}
                  </div>
                  {!cell.outside && (
                    <>
                      <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
                        {visible.map((event, ei) => (
                          <div key={ei} onClick={() => openDetail(event, cell.day)}
                            className={`px-1.5 py-1 rounded-lg font-medium flex items-center cursor-pointer ${event.color}`}>
                            <div className="flex-1 min-w-0">
                              {event.time && <p className="font-bold text-xs leading-none mb-0.5">{event.time}</p>}
                              <p className="font-semibold leading-tight truncate text-sm">{event.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {hidden > 0 && (
                        <button onClick={() => openPanel(cell)} className="mt-auto w-full text-center text-xs font-bold text-primary hover:bg-primary/10 transition-colors py-0.5 rounded-lg shrink-0">
                          +{hidden} {t.calendar.viewMore}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau détail jour */}
        {dayDetail && (
          <div className={`w-110 shrink-0 transition-all duration-300 ${panelVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <div>
                  <p className="text-xl font-bold text-on-surface">{t.calendar.months[dayDetail.month]} {dayDetail.day}</p>
                  <p className="text-base text-on-surface-variant">{dayDetail.events.length} {dayDetail.events.length > 1 ? t.calendar.eventsPlural : t.calendar.events}</p>
                </div>
                <button onClick={closePanel} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {dayDetail.events.map((event, i) => (
                  <div key={i} onClick={() => openDetail(event, dayDetail.day)}
                    className={`px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer ${event.color}`}>
                    <div className="flex-1 min-w-0">
                      {event.time && <p className="text-sm font-bold mb-1">{event.time}</p>}
                      <p className="text-base font-bold">{event.title}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-bold rounded-md ${TAG_BADGE[event.tag]}`}>{event.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal détail (lecture seule, tout le monde) ── */}
      {detailInfo && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${detailVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeDetail} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto transition-all duration-200 ${detailVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-start justify-between px-7 pt-7 pb-4">
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${TAG_ACTIVE[detailInfo.event.tag]}`}>
                  {detailInfo.event.tag}
                </span>
                <button onClick={closeDetail} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="px-7 pb-7 space-y-6">
                <p className="text-3xl font-extrabold text-on-surface leading-tight">{detailInfo.event.title}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-primary shrink-0" />
                    <span className="text-base font-semibold text-on-surface">
                      {t.calendar.fullDays[new Date(detailInfo.year, detailInfo.month, detailInfo.day).getDay()]}{' '}
                      {detailInfo.day} {t.calendar.months[detailInfo.month]} {detailInfo.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-primary shrink-0" />
                    <span className="text-base font-semibold text-on-surface">{detailInfo.event.time}</span>
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
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Remarques</p>
                    </div>
                    <p className="text-base text-on-surface leading-relaxed">{detailInfo.event.remarques}</p>
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="px-7 py-4 border-t border-outline-variant shrink-0 flex justify-end">
                  <button
                    onClick={() => { closeDetail(); setTimeout(() => openEdit(detailInfo.event, detailInfo.day), 200); }}
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

      {/* ── Modal édition (admin/coach) ── */}
      {editEvent && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.calendar.editEvent}</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                {/* Titre */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldTitle}</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>

                {/* Date & Heure — côte à côte */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 block">{t.calendar.fieldDate} & {t.calendar.fieldHour}</label>
                  <div className="flex gap-6">

                    {/* Calendrier */}
                    <div className="flex-1">
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
                          const sel = day !== null && day === editForm.day && editCalMonth === editForm.month && editCalYear === editForm.year;
                          return (
                            <button key={i} disabled={day === null}
                              onClick={() => day && setEditForm(f => ({ ...f, day, month: editCalMonth, year: editCalYear }))}
                              className={`h-9 w-full rounded-lg text-sm font-semibold transition-all ${!day ? 'invisible' : sel ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-container text-on-surface'}`}>
                              {day || ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sélecteur heure */}
                    <div className="w-52 flex flex-col justify-center gap-2">
                      <p className="text-xs font-bold text-on-surface-variant text-center uppercase tracking-widest">{t.calendar.fieldHour}</p>
                      <div className="flex items-center justify-center gap-5 bg-surface-container rounded-2xl py-6">
                        <div className="flex flex-col items-center gap-3">
                          <button onClick={() => setEditForm(f => ({ ...f, hour: (f.hour + 1) % 24 }))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                            <ChevronUp size={18} className="text-on-surface-variant" />
                          </button>
                          <span className="text-4xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(editForm.hour).padStart(2, '0')}</span>
                          <button onClick={() => setEditForm(f => ({ ...f, hour: (f.hour - 1 + 24) % 24 }))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                            <ChevronDown size={18} className="text-on-surface-variant" />
                          </button>
                        </div>
                        <span className="text-4xl font-extrabold text-on-surface-variant pb-1">:</span>
                        <div className="flex flex-col items-center gap-3">
                          <button onClick={() => setEditForm(f => ({ ...f, minute: (f.minute + 5) % 60 }))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                            <ChevronUp size={18} className="text-on-surface-variant" />
                          </button>
                          <span className="text-4xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(editForm.minute).padStart(2, '0')}</span>
                          <button onClick={() => setEditForm(f => ({ ...f, minute: (f.minute - 5 + 60) % 60 }))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                            <ChevronDown size={18} className="text-on-surface-variant" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Catégorie — pleine largeur, pills horizontaux */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldType}</label>
                  <div className="grid grid-cols-4 gap-3">
                    {TAGS.map(tag => (
                      <button key={tag} onClick={() => setEditForm(f => ({ ...f, tag }))}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${editForm.tag === tag ? TAG_ACTIVE[tag] : `bg-surface-container text-on-surface-variant border-outline-variant ${TAG_HOVER[tag]}`}`}>
                        {t.calendar.tags[tag]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lieu */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                    {t.calendar.fieldLocation} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" value={editForm.lieu} onChange={e => setEditForm(f => ({ ...f, lieu: e.target.value }))}
                      placeholder={t.calendar.fieldLocationPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                  </div>
                </div>

                {/* Remarques */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                    {t.calendar.fieldNotes} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-3.5 text-on-surface-variant" />
                    <textarea value={editForm.remarques} onChange={e => setEditForm(f => ({ ...f, remarques: e.target.value }))}
                      rows={4} placeholder={t.calendar.fieldNotesPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline resize-none" />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-5 border-t border-outline-variant shrink-0">
                <button onClick={async () => {
                  if (!editEvent?.id) return;
                  await fetch(`/api/backend/events/${editEvent.id}`, { method: 'DELETE' });
                  await fetchEvents(); closeEdit(); closeDetail();
                }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold">
                  <Trash2 size={16} /> {t.common.delete}
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={closeEdit} className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                  <button onClick={async () => {
                    if (!editEvent?.id) return;
                    await fetch(`/api/backend/events/${editEvent.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: editForm.title, tag: editForm.tag, event_date: `${editForm.year}-${pad(editForm.month + 1)}-${pad(editForm.day)}`, event_time: `${pad(editForm.hour)}:${pad(editForm.minute)}`, location: editForm.lieu || null, notes: editForm.remarques || null }),
                    });
                    await fetchEvents(); closeEdit();
                  }} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.calendar.createEvent}</p>
                <button onClick={closeCreateForm} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">{t.calendar.fieldTitle}</label>
                  <input type="text" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={t.calendar.fieldTitlePlaceholder}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 block">{t.calendar.fieldDate} & {t.calendar.fieldHour}</label>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={prevCreateCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                          <ChevronLeft size={16} className="text-on-surface-variant" />
                        </button>
                        <span className="text-sm font-bold text-on-surface">{t.calendar.months[createCalMonth]} {createCalYear}</span>
                        <button onClick={nextCreateCal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                          <ChevronRight size={16} className="text-on-surface-variant" />
                        </button>
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
                              className={`h-9 w-full rounded-lg text-sm font-semibold transition-all ${!day ? 'invisible' : sel ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-container text-on-surface'}`}>
                              {day || ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="w-52 flex flex-col justify-center gap-2">
                      <p className="text-xs font-bold text-on-surface-variant text-center uppercase tracking-widest">{t.calendar.fieldHour}</p>
                      <div className="flex items-center justify-center gap-5 bg-surface-container rounded-2xl py-6">
                        <div className="flex flex-col items-center gap-3">
                          <button onClick={() => setCreateForm(f => ({ ...f, hour: (f.hour + 1) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronUp size={18} className="text-on-surface-variant" /></button>
                          <span className="text-4xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(createForm.hour).padStart(2, '0')}</span>
                          <button onClick={() => setCreateForm(f => ({ ...f, hour: (f.hour - 1 + 24) % 24 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronDown size={18} className="text-on-surface-variant" /></button>
                        </div>
                        <span className="text-4xl font-extrabold text-on-surface-variant pb-1">:</span>
                        <div className="flex flex-col items-center gap-3">
                          <button onClick={() => setCreateForm(f => ({ ...f, minute: (f.minute + 5) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronUp size={18} className="text-on-surface-variant" /></button>
                          <span className="text-4xl font-extrabold text-on-surface w-14 text-center tabular-nums">{String(createForm.minute).padStart(2, '0')}</span>
                          <button onClick={() => setCreateForm(f => ({ ...f, minute: (f.minute - 5 + 60) % 60 }))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"><ChevronDown size={18} className="text-on-surface-variant" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">{t.calendar.fieldType}</label>
                  <div className="grid grid-cols-4 gap-3">
                    {TAGS.map(tag => (
                      <button key={tag} onClick={() => setCreateForm(f => ({ ...f, tag }))}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${createForm.tag === tag ? TAG_ACTIVE[tag] : `bg-surface-container text-on-surface-variant border-outline-variant ${TAG_HOVER[tag]}`}`}>
                        {t.calendar.tags[tag]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                    {t.calendar.fieldLocation} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" value={createForm.lieu} onChange={e => setCreateForm(f => ({ ...f, lieu: e.target.value }))}
                      placeholder={t.calendar.fieldLocationPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                    {t.calendar.fieldNotes} <span className="font-normal normal-case tracking-normal opacity-60">({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-3.5 text-on-surface-variant" />
                    <textarea value={createForm.remarques} onChange={e => setCreateForm(f => ({ ...f, remarques: e.target.value }))}
                      rows={4} placeholder={t.calendar.fieldNotesPlaceholder}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline resize-none" />
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end px-8 py-5 border-t border-outline-variant shrink-0 gap-3">
                <button onClick={closeCreateForm} className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={async () => {
                  if (!createForm.title.trim()) return;
                  await fetch('/api/backend/events', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: createForm.title, tag: createForm.tag, event_date: `${createForm.year}-${pad(createForm.month + 1)}-${pad(createForm.day)}`, event_time: `${pad(createForm.hour)}:${pad(createForm.minute)}`, location: createForm.lieu || null, notes: createForm.remarques || null }),
                  });
                  await fetchEvents(); closeCreateForm();
                }} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.add}</button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
