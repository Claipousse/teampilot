'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MessageSquare, MapPin, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useT } from '@/contexts/LanguageContext';
import { TAG_STYLE, STATUS_BADGE, PLAYER_STATUS, SS_SEASON, fmtEventDate, type EventTag } from '@/lib/dashboardUtils';

export default function DashboardMobile() {
  const t = useT();
  const router = useRouter();
  const { upcoming, unavailable, summary, recentConvs, myPlayer, teammates, auth, authLoading, isAdmin } = useDashboard();

  if (authLoading) return null;

  const firstName = auth?.firstName ?? '';

  return (
    <div className="flex flex-col gap-6 pb-24">

      {/* En-tête : titre + date */}
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t.dashboard.pageTitle}</p>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t.dashboard.greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* Vue joueur */}
      {auth?.type === 'player' ? (
        <>
          {/* Carte profil */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-5 border-b border-outline-variant">
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
                  {myPlayer?.position && <span className="text-xs font-semibold text-on-surface-variant">{myPlayer.position}</span>}
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
                  {!myPlayer && <span className="text-xs text-on-surface-variant">Chargement…</span>}
                </div>
              </div>
            </div>

            {/* Stats sur 2 rangées de 3 (mobile) */}
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

          <SectionHeader icon={<Calendar size={18} className="text-primary" />} title={t.dashboard.upcomingEvents} href="/calendrier" linkLabel={t.dashboard.viewAll} />
          <EventListMobile events={upcoming} t={t} router={router} />

          <SectionHeader icon={<MessageSquare size={18} className="text-on-surface-variant" />} title={t.dashboard.recentMessages} href="/messagerie" linkLabel={t.dashboard.viewAll} />
          <ConvListMobile convs={recentConvs} t={t} />

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
          {/* Panneau admin */}
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

          <SectionHeader icon={<Calendar size={18} className="text-primary" />} title={t.dashboard.upcomingEvents} href="/calendrier" linkLabel={t.dashboard.viewAll} />
          <EventListMobile events={upcoming} t={t} router={router} />

          <SectionHeader icon={<MessageSquare size={18} className="text-on-surface-variant" />} title={t.dashboard.recentMessages} href="/messagerie" linkLabel={t.dashboard.viewAll} />
          <ConvListMobile convs={recentConvs} t={t} />

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
        </>
      )}
    </div>
  );
}

// ─── Sous-composants locaux ───────────────────────────────────────────────────

// En-tête de section réutilisable (titre + lien "voir tout")
function SectionHeader({ icon, title, href, linkLabel }: { icon: React.ReactNode; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-on-surface">{title}</h2>
      </div>
      <Link href={href} className="text-xs font-semibold text-primary flex items-center gap-0.5">
        {linkLabel} <ChevronRight size={13} />
      </Link>
    </div>
  );
}

// Liste des événements (version mobile)
function EventListMobile({ events, t, router }: { events: any[]; t: any; router: any }) {
  if (events.length === 0) {
    return <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noUpcomingEvents}</p>;
  }
  return (
    <div className="space-y-2">
      {events.slice(0, 4).map((ev: any) => {
        const ts = TAG_STYLE[ev.tag as EventTag] ?? TAG_STYLE['Réunion'];
        return (
          <div key={ev.id} onClick={() => router.push(`/calendrier?eventId=${ev.id}`)}
            className={`flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ${ts.border} cursor-pointer active:brightness-95 transition-all`}>
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
  );
}

// Liste des conversations récentes (version mobile)
function ConvListMobile({ convs, t }: { convs: any[]; t: any }) {
  if (convs.length === 0) {
    return <p className="text-sm text-on-surface-variant text-center py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">{t.dashboard.noMessages}</p>;
  }
  return (
    <div className="space-y-2">
      {convs.map((conv: any) => (
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
  );
}
