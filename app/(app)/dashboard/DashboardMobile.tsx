'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MessageSquare, MapPin, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LanguageContext';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

const TAG_STYLE: Record<EventTag, { border: string; badge: string; text: string; dot: string }> = {
  'Match':        { border: 'border-l-4 border-error',     badge: 'bg-error/10',     text: 'text-error',     dot: 'bg-error' },
  'Entraînement': { border: 'border-l-4 border-primary',   badge: 'bg-primary/10',   text: 'text-primary',   dot: 'bg-primary' },
  'Récupération': { border: 'border-l-4 border-secondary', badge: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  'Réunion':      { border: 'border-l-4 border-outline',   badge: 'bg-surface-container', text: 'text-on-surface', dot: 'bg-outline' },
};

const STATUS_BADGE: Record<string, string> = {
  'Blessé':    'bg-error/10 text-error',
  'Suspendu':  'bg-[#F97316]/10 text-[#F97316]',
  'Incertain': 'bg-primary/10 text-primary',
};

const PLAYER_STATUS: Record<string, { badge: string; dot: string; text: string }> = {
  'Disponible': { badge: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', text: 'text-secondary' },
  'Blessé':     { badge: 'bg-error/10 text-error',         dot: 'bg-error',     text: 'text-error' },
  'Suspendu':   { badge: 'bg-[#F97316]/10 text-[#F97316]', dot: 'bg-[#F97316]', text: 'text-[#F97316]' },
  'Incertain':  { badge: 'bg-primary/10 text-primary',     dot: 'bg-primary',   text: 'text-primary' },
};

const SS_SEASON: Record<string, string> = {
  'À venir':  'bg-[#F97316]/10 text-[#F97316]',
  'En cours': 'bg-secondary/10 text-secondary',
  'Terminée': 'bg-error/10 text-error',
};

function fmtEventDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function DashboardMobile() {
  const { isAdmin } = useCurrentUser();
  const { user: auth, loading: authLoading } = useAuth();
  const t = useT();
  const router = useRouter();

  const [kpis,        setKpis]        = useState({ total_players: 0, available_players: 0, upcoming_events_count: 0, unread_messages: 0 });
  const [upcoming,    setUpcoming]    = useState<any[]>([]);
  const [unavailable, setUnavailable] = useState<any[]>([]);
  const [summary,     setSummary]     = useState<any>(null);
  const [recentConvs, setRecentConvs] = useState<any[]>([]);
  const [myPlayer,    setMyPlayer]    = useState<any>(null);
  const [teammates,   setTeammates]   = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [kRes, uRes, unRes, mRes] = await Promise.all([
      fetch('/api/backend/dashboard/kpis'),
      fetch('/api/backend/dashboard/upcoming-events'),
      fetch('/api/backend/dashboard/unavailable-players'),
      fetch('/api/backend/messages/conversations'),
    ]);
    if (kRes.ok)  setKpis(await kRes.json());
    if (uRes.ok)  setUpcoming(await uRes.json());
    if (unRes.ok) setUnavailable(await unRes.json());
    if (mRes.ok)  setRecentConvs((await mRes.json()).slice(0, 3));
    if (isAdmin) {
      const sRes = await fetch('/api/backend/dashboard/admin-summary');
      if (sRes.ok) setSummary(await sRes.json());
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (auth?.type !== 'player') return;
    fetch('/api/backend/players')
      .then(r => r.ok ? r.json() : [])
      .then((ps: any[]) => {
        const me = auth.playerId
          ? (ps.find((p: any) => p.id === auth.playerId) ?? ps.find((p: any) =>
              p.first_name?.toLowerCase() === auth.firstName?.toLowerCase() &&
              p.last_name?.toLowerCase() === auth.lastName?.toLowerCase()))
          : ps.find((p: any) =>
              p.first_name?.toLowerCase() === auth.firstName?.toLowerCase() &&
              p.last_name?.toLowerCase() === auth.lastName?.toLowerCase());
        setMyPlayer(me ?? null);
        setTeammates(ps.filter((p: any) => p.id !== me?.id));
      });
  }, [auth?.type, auth?.playerId, auth?.firstName, auth?.lastName]);

  if (authLoading) return null;

  const firstName = auth?.firstName ?? '';

  return (
    <div className="flex flex-col gap-6 pb-24">

      {/* Header */}
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t.dashboard.pageTitle}</p>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t.dashboard.greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {auth?.type === 'player' ? (
        <>
          {/* Carte profil joueur */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">

            {/* Section identité */}
            <div className="flex items-center gap-4 px-5 py-5 border-b border-outline-variant">

              {/* Avatar */}
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden border-4 border-surface shadow-sm">
                  {myPlayer?.photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={myPlayer.photo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-xl font-extrabold text-white">
                        {(auth?.firstName?.[0] ?? '?').toUpperCase()}{(auth?.lastName?.[0] ?? '').toUpperCase()}
                      </span>
                  }
                </div>
              </div>

              {/* Nom + détails */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-on-surface tracking-tight leading-tight">
                    {auth?.firstName ?? '—'} {auth?.lastName ?? ''}
                  </h2>
                  {myPlayer?.shirt_number != null && (
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-container text-xs font-extrabold text-on-surface-variant">#{myPlayer.shirt_number}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {myPlayer?.position && (
                    <span className="text-xs font-semibold text-on-surface-variant">{myPlayer.position}</span>
                  )}
                  {myPlayer?.status && (
                    <>
                      {myPlayer.position && <span className="text-outline text-xs">·</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLAYER_STATUS[myPlayer.status]?.badge ?? 'bg-surface-container text-on-surface-variant'}`}>
                        {t.players.statuses[myPlayer.status as keyof typeof t.players.statuses] ?? myPlayer.status}
                      </span>
                    </>
                  )}
                  {myPlayer?.nationality_flag && /^[a-z]{2}/.test(myPlayer.nationality_flag) && (
                    <>
                      <span className="text-outline text-xs">·</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://flagcdn.com/w20/${myPlayer.nationality_flag}.png`} alt="" width={16} height={12} className="rounded-sm" />
                    </>
                  )}
                  {!myPlayer && (
                    <span className="text-xs text-on-surface-variant">Chargement…</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bande de stats */}
            <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant">
              {([
                { v: myPlayer?.matches,        label: t.players.matches },
                { v: myPlayer?.goals,          label: t.players.goals },
                { v: myPlayer?.assists,        label: 'Passes décisives' },
              ] as const).map(({ v, label }) => (
                <div key={label} className="py-4 text-center">
                  <p className="text-2xl font-extrabold text-on-surface leading-none">{v ?? 0}</p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-outline-variant">
              {([
                { v: myPlayer?.minutes_played, label: 'Minutes jouées' },
                { v: myPlayer?.yellow_cards,   label: t.players.yellowCards },
                { v: myPlayer?.red_cards,      label: t.players.redCards },
              ] as const).map(({ v, label }) => (
                <div key={label} className="py-4 text-center">
                  <p className="text-2xl font-extrabold text-on-surface leading-none">{v ?? 0}</p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prochains événements */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.upcomingEvents}</h2>
              </div>
              <Link href="/calendrier" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewAll} <ChevronRight size={13} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noUpcomingEvents}</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 4).map((ev: any) => {
                  const ts = TAG_STYLE[ev.tag as EventTag] ?? TAG_STYLE['Réunion'];
                  return (
                    <div key={ev.id} onClick={() => router.push(`/calendrier?eventId=${ev.id}`)} className={`flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ${ts.border} cursor-pointer active:brightness-95 transition-all`}>
                      <div className="shrink-0 text-center min-w-[48px]">
                        <p className="text-xs text-on-surface-variant font-semibold">{fmtEventDate(ev.event_date)}</p>
                        <p className="text-sm font-extrabold text-on-surface">{ev.event_time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{ev.title}</p>
                        {ev.location && (
                          <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                            <MapPin size={10} className="shrink-0" /><span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${ts.badge} ${ts.text}`}>{ev.tag}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Messages récents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-on-surface-variant" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.recentMessages}</h2>
              </div>
              <Link href="/messagerie" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewAll} <ChevronRight size={13} />
              </Link>
            </div>
            {recentConvs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noMessages}</p>
            ) : (
              <div className="space-y-2">
                {recentConvs.map((conv: any) => (
                  <Link key={conv.id} href="/messagerie"
                    className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                    <div className={`w-10 h-10 rounded-full ${conv.avatar_bg} flex items-center justify-center shrink-0`}>
                      <span className={`font-bold text-sm ${conv.is_ai ? 'text-white' : 'text-on-surface-variant'}`}>{conv.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{conv.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{conv.preview}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant shrink-0">{conv.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Teammates — en bas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.teammates}</h2>
                <span className="text-xs text-on-surface-variant/60">
                  {teammates.filter((p: any) => p.status === 'Disponible').length}/{teammates.length} {t.dashboard.kpiAvailable}
                </span>
              </div>
              <Link href="/joueurs" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewAll} <ChevronRight size={13} />
              </Link>
            </div>
            {teammates.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noTeammates}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {teammates.map((tm: any) => {
                  const ss = PLAYER_STATUS[tm.status] ?? PLAYER_STATUS['Disponible'];
                  const ini = ((tm.first_name?.[0] ?? '') + (tm.last_name?.[0] ?? '')).toUpperCase();
                  return (
                    <div key={tm.id} className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                        {tm.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={tm.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                          : <span className="text-xs font-bold text-on-surface-variant">{ini}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{tm.first_name} {tm.last_name?.charAt(0)}.</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${ss.dot} shrink-0`} />
                          <span className={`text-xs font-semibold ${ss.text} truncate`}>
                            {t.players.statuses[tm.status as keyof typeof t.players.statuses] ?? tm.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: t.dashboard.kpiPlayers,  value: kpis.total_players,         sub: `${kpis.available_players} ${t.dashboard.kpiAvailable}`, Icon: Users,         accent: 'text-primary',   bg: 'bg-primary/5',   border: 'border-primary/20',   href: '/joueurs' },
              { label: t.dashboard.kpiEvents,   value: kpis.upcoming_events_count, sub: t.dashboard.kpiUpcoming,                                  Icon: Calendar,      accent: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20', href: '/calendrier' },
              { label: t.dashboard.kpiMessages, value: kpis.unread_messages,       sub: t.dashboard.kpiUnread,                                    Icon: MessageSquare, accent: 'text-error',     bg: 'bg-error/5',     border: 'border-error/20',     href: '/messagerie' },
            ] as const).map(kpi => (
              <Link key={kpi.label} href={kpi.href} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-4 flex flex-col gap-1.5 active:brightness-95 transition-all`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{kpi.label}</p>
                  <kpi.Icon size={16} className={kpi.accent} />
                </div>
                <p className={`text-3xl font-extrabold leading-none ${kpi.accent}`}>{kpi.value}</p>
                <p className="text-xs text-on-surface-variant">{kpi.sub}</p>
              </Link>
            ))}
          </div>

          {/* Prochains événements */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.upcomingEvents}</h2>
              </div>
              <Link href="/calendrier" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewAll} <ChevronRight size={13} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noUpcomingEvents}</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 4).map((ev: any) => {
                  const ts = TAG_STYLE[ev.tag as EventTag] ?? TAG_STYLE['Réunion'];
                  return (
                    <div key={ev.id} onClick={() => router.push(`/calendrier?eventId=${ev.id}`)} className={`flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ${ts.border} cursor-pointer active:brightness-95 transition-all`}>
                      <div className="shrink-0 text-center min-w-[48px]">
                        <p className="text-xs text-on-surface-variant font-semibold">{fmtEventDate(ev.event_date)}</p>
                        <p className="text-sm font-extrabold text-on-surface">{ev.event_time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{ev.title}</p>
                        {ev.location && (
                          <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                            <MapPin size={10} className="shrink-0" /><span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${ts.badge} ${ts.text}`}>{ev.tag}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Messages récents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-on-surface-variant" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.recentMessages}</h2>
              </div>
              <Link href="/messagerie" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewAll} <ChevronRight size={13} />
              </Link>
            </div>
            {recentConvs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noMessages}</p>
            ) : (
              <div className="space-y-2">
                {recentConvs.map((conv: any) => (
                  <Link key={conv.id} href="/messagerie"
                    className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                    <div className={`w-10 h-10 rounded-full ${conv.avatar_bg} flex items-center justify-center shrink-0`}>
                      <span className={`font-bold text-sm ${conv.is_ai ? 'text-white' : 'text-on-surface-variant'}`}>{conv.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{conv.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{conv.preview}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant shrink-0">{conv.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Joueurs non disponibles */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#F97316]" />
                <h2 className="text-base font-bold text-on-surface">{t.dashboard.unavailable}</h2>
              </div>
              <Link href="/joueurs" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                {t.dashboard.viewPlayersList} <ChevronRight size={13} />
              </Link>
            </div>
            {unavailable.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.allAvailable}</p>
            ) : (
              <div className="space-y-2">
                {unavailable.map((p: any) => {
                  const initials = (p.first_name[0] + p.last_name[0]).toUpperCase();
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                      <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        {p.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                          : <span className="text-sm font-bold text-on-surface-variant">{initials}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-bold text-on-surface">{p.first_name} {p.last_name.charAt(0)}.</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[p.status] ?? ''}`}>
                            {t.players.statuses[p.status as keyof typeof t.players.statuses] ?? p.status}
                          </span>
                        </div>
                        {p.injury_description && <p className="text-xs text-on-surface-variant/70 truncate">{p.injury_description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Panneau Admin */}
          {isAdmin && (
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-error/80 flex items-center justify-center shrink-0">
                  <Shield size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-on-surface">{t.dashboard.adminPanel}</h2>
                  <p className="text-xs text-on-surface-variant">{t.dashboard.adminOnly}</p>
                </div>
                <Link href="/administration" className="text-xs font-semibold text-error/80 flex items-center gap-0.5 shrink-0">
                  {t.common.manage} <ChevronRight size={13} />
                </Link>
              </div>
              <div className="border border-error/25 bg-error/5 rounded-2xl p-4 space-y-3">

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t.dashboard.clubCard}</p>
                  <p className="text-base font-extrabold text-on-surface">{summary?.club?.name ?? '—'}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{summary?.club?.league ?? '—'}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">{summary?.club?.founded_year ? `${t.dashboard.founded} ${summary.club.founded_year}` : ''}</p>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t.dashboard.seasonCard}</p>
                  {summary?.season ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-extrabold text-on-surface">{summary.season.label}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SS_SEASON[summary.season.status] ?? ''}`}>{summary.season.status}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant">{summary.season.competitions}</p>
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">{t.dashboard.objective} {summary.season.objective}</p>
                    </>
                  ) : <p className="text-sm text-on-surface-variant">—</p>}
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    {t.dashboard.staffCard} · <span className="normal-case font-semibold text-on-surface">{summary?.staff?.length ?? 0} {t.common.members}</span>
                  </p>
                  <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
                    {(summary?.staff ?? []).map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
            </section>
          )}
        </>
      )}

    </div>
  );
}
