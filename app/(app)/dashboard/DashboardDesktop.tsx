'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, MessageSquare, MapPin, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LanguageContext';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

const TAG_STYLE: Record<EventTag, { border: string; badge: string; text: string }> = {
  'Match':        { border: 'border-l-4 border-error',     badge: 'bg-error/10',     text: 'text-error' },
  'Entraînement': { border: 'border-l-4 border-primary',   badge: 'bg-primary/10',   text: 'text-primary' },
  'Récupération': { border: 'border-l-4 border-secondary', badge: 'bg-secondary/10', text: 'text-secondary' },
  'Réunion':      { border: 'border-l-4 border-outline',   badge: 'bg-surface-container', text: 'text-on-surface' },
};

const STATUS_BADGE: Record<string, string> = {
  'Blessé':    'bg-error/10 text-error',
  'Suspendu':  'bg-[#F97316]/10 text-[#F97316]',
  'Incertain': 'bg-primary/10 text-primary',
};

const SS_SEASON: Record<string, string> = {
  'À venir':  'bg-[#F97316]/10 text-[#F97316]',
  'En cours': 'bg-secondary/10 text-secondary',
  'Terminée': 'bg-error/10 text-error',
};

function fmtDate(iso?: string) { return iso ? iso.split('-').reverse().join('/') : '—'; }
function fmtEventDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function DashboardDesktop() {
  const { isAdmin } = useCurrentUser();
  const { user: auth } = useAuth();
  const t = useT();

  const [kpis,       setKpis]       = useState({ total_players: 0, available_players: 0, upcoming_events_count: 0, unread_messages: 0 });
  const [upcoming,   setUpcoming]   = useState<any[]>([]);
  const [unavailable, setUnavailable] = useState<any[]>([]);
  const [summary,    setSummary]    = useState<any>(null);

  const fetchAll = useCallback(async () => {
    const [kRes, uRes, unRes] = await Promise.all([
      fetch('/api/backend/dashboard/kpis'),
      fetch('/api/backend/dashboard/upcoming-events'),
      fetch('/api/backend/dashboard/unavailable-players'),
    ]);
    if (kRes.ok)  setKpis(await kRes.json());
    if (uRes.ok)  setUpcoming(await uRes.json());
    if (unRes.ok) setUnavailable(await unRes.json());
    if (isAdmin) {
      const sRes = await fetch('/api/backend/dashboard/admin-summary');
      if (sRes.ok) setSummary(await sRes.json());
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fullName = auth ? `${auth.firstName} ${auth.lastName}` : '';

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">{t.dashboard.pageTitle}</p>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{t.dashboard.greeting}{fullName ? `, ${fullName}` : ''}</h1>
          <p className="text-base text-on-surface-variant mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl shrink-0">
          <Calendar size={18} className="text-on-surface-variant" />
          <span className="text-base font-semibold text-on-surface">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: t.dashboard.kpiPlayers,  value: kpis.total_players,          sub: `${kpis.available_players} ${t.dashboard.kpiAvailable}`, Icon: Users,         accent: 'text-primary',   bg: 'bg-primary/5',   border: 'border-primary/20' },
          { label: t.dashboard.kpiEvents,   value: kpis.upcoming_events_count,  sub: t.dashboard.kpiUpcoming,                                  Icon: Calendar,      accent: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20' },
          { label: t.dashboard.kpiMessages, value: kpis.unread_messages,        sub: t.dashboard.kpiUnread,                                    Icon: MessageSquare, accent: 'text-error',     bg: 'bg-error/5',     border: 'border-error/20' },
        ] as const).map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-5 flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{kpi.label}</p>
              <kpi.Icon size={18} className={kpi.accent} />
            </div>
            <p className={`text-4xl font-extrabold leading-none ${kpi.accent}`}>{kpi.value}</p>
            <p className="text-sm text-on-surface-variant">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Événements + Messages */}
      <div className="grid grid-cols-5 gap-4">

        <div className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-on-surface">{t.dashboard.upcomingEvents}</h2>
            </div>
            <a href="/calendrier" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              {t.dashboard.viewCalendar} <ChevronRight size={14} />
            </a>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">Aucun événement à venir</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((ev: any) => {
                const ts = TAG_STYLE[ev.tag as EventTag] ?? TAG_STYLE['Réunion'];
                return (
                  <div key={ev.id} className={`flex items-center gap-4 p-4 rounded-xl ${ts.border} bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer`}>
                    <div className="shrink-0 w-14 text-center">
                      <p className="text-xs font-bold text-on-surface-variant">{fmtEventDate(ev.event_date)}</p>
                      <p className="text-base font-extrabold text-on-surface leading-tight">{ev.event_time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{ev.title}</p>
                      {ev.location && (
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                          <MapPin size={11} className="shrink-0" /><span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${ts.badge} ${ts.text}`}>{ev.tag}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages récents — statique Phase 4 */}
        <div className="col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-on-surface-variant" />
              <h2 className="text-lg font-bold text-on-surface">{t.dashboard.recentMessages}</h2>
            </div>
            <a href="/messagerie" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              {t.dashboard.viewAll} <ChevronRight size={14} />
            </a>
          </div>
          <p className="text-sm text-on-surface-variant text-center py-4">Messagerie disponible en Phase 4</p>
        </div>
      </div>

      {/* Joueurs non disponibles */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-on-surface">{t.dashboard.unavailable}</h2>
            <span className="text-xs text-on-surface-variant/60">
              {unavailable.length} {unavailable.length > 1 ? t.dashboard.affectedPlural : t.dashboard.affected}
            </span>
          </div>
          <a href="/joueurs" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            {t.dashboard.viewPlayersList} <ChevronRight size={14} />
          </a>
        </div>
        {unavailable.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">Tous les joueurs sont disponibles</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {unavailable.map((p: any) => {
              const initials = (p.first_name[0] + p.last_name[0]).toUpperCase();
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                  <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      : <span className="text-sm font-bold text-on-surface-variant">{initials}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-on-surface">{p.first_name} {p.last_name.charAt(0)}.</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[p.status] ?? ''}`}>{p.status}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{p.position}</p>
                    {p.injury_description && <p className="text-xs text-on-surface-variant/60 truncate">{p.injury_description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panneau Admin */}
      {isAdmin && (
        <div className="border border-error/25 bg-error/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-error/80 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{t.dashboard.adminPanel}</h2>
              <p className="text-xs text-on-surface-variant">{t.dashboard.adminOnly}</p>
            </div>
            <a href="/administration" className="ml-auto text-sm font-semibold text-error/80 hover:underline flex items-center gap-1">
              {t.common.manage} <ChevronRight size={14} />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4">

            {/* Club */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.dashboard.clubCard}</p>
                <p className="text-base font-extrabold text-on-surface">{summary?.club?.name ?? '—'}</p>
                <p className="text-sm text-on-surface-variant mt-1">{summary?.club?.league ?? '—'}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">{summary?.club?.founded_year ? `${t.dashboard.founded} ${summary.club.founded_year}` : ''}{summary?.club?.city ? ` · ${summary.club.city}` : ''}</p>
              </div>
              <div className="border-t border-outline-variant pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest w-16 shrink-0">Email</span>
                  <span className="text-xs text-on-surface truncate">{summary?.club?.email ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest w-16 shrink-0">Tél.</span>
                  <span className="text-xs text-on-surface">{summary?.club?.phone ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Saison */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.dashboard.seasonCard}</p>
                {summary?.season ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-base font-extrabold text-on-surface">{summary.season.label}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${SS_SEASON[summary.season.status] ?? ''}`}>{summary.season.status}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{summary.season.competitions}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">{t.dashboard.objective} {summary.season.objective}</p>
                  </>
                ) : <p className="text-sm text-on-surface-variant">—</p>}
              </div>
              {summary?.season && (
                <div className="border-t border-outline-variant pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">{t.dashboard.start}</span>
                    <span className="font-semibold text-on-surface">{fmtDate(summary.season.start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">{t.dashboard.end}</span>
                    <span className="font-semibold text-on-surface">{fmtDate(summary.season.end_date)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Staff */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {t.dashboard.staffCard} · <span className="normal-case font-semibold text-on-surface">{summary?.staff?.length ?? 0} {t.common.members}</span>
              </p>
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {(summary?.staff ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{s.first_name[0]}{s.last_name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
