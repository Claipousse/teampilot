'use client';

import { Calendar, Users, MessageSquare, MapPin, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT } from '@/contexts/LanguageContext';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

// ─── Données mock ──────────────────────────────────────────────────────────────

const UPCOMING_EVENTS: { id: number; date: string; time: string; title: string; tag: EventTag; lieu: string }[] = [
  { id: 1, date: '05/06', time: '10:00', title: 'Pre-Match Training',    tag: 'Entraînement', lieu: 'Terrain principal' },
  { id: 2, date: '05/06', time: '15:00', title: 'Match Away',            tag: 'Match',        lieu: 'Etihad Stadium' },
  { id: 3, date: '07/06', time: '11:00', title: 'Tactical Analysis',     tag: 'Réunion',      lieu: 'Salle vidéo · Bât. B' },
  { id: 4, date: '09/06', time: '09:30', title: 'Gym Session',           tag: 'Entraînement', lieu: 'Salle de musculation' },
  { id: 5, date: '19/06', time: '17:00', title: 'Home Match',            tag: 'Match',        lieu: 'Stade principal' },
];

const RECENT_MESSAGES: { id: number; initials: string; name: string; preview: string; time: string; unread: boolean; avatarBg: string; initBg: string }[] = [
  { id: 1, initials: '✦', name: 'Tactical AI',     preview: 'Le planning de la semaine prochaine est disponible.',  time: '8:06',  unread: true,  avatarBg: 'bg-primary',               initBg: 'text-white' },
  { id: 2, initials: 'CM', name: 'Coach Marcus',   preview: 'On reprend à 14h sur le terrain 2.',                   time: '10:45', unread: true,  avatarBg: 'bg-surface-container-high', initBg: 'text-on-surface-variant' },
  { id: 3, initials: 'SB', name: 'Sarah Bernard',  preview: 'Bilan médical de Julian R. après scanner.',            time: '9:12',  unread: false, avatarBg: 'bg-surface-container-high', initBg: 'text-on-surface-variant' },
];

const PLAYERS_UNAVAILABLE = [
  { id: 2, initials: 'JR', name: 'Julian R.',  position: 'Arrière Gauche',    status: 'Blessé'   as const, detail: 'Ischio-jambiers · 3 sem.' },
  { id: 5, initials: 'AM', name: 'Alex M.',    position: 'Défenseur Central', status: 'Suspendu' as const, detail: '2 matchs de suspension' },
  { id: 6, initials: 'TO', name: 'Tom O.',     position: 'Ailier Droit',      status: 'Incertain' as const, detail: 'Gêne musculaire cuisse' },
];

const STATUS_BADGE: Record<string, string> = {
  'Blessé':    'bg-error/10 text-error',
  'Suspendu':  'bg-[#F97316]/10 text-[#F97316]',
  'Incertain': 'bg-primary/10 text-primary',
};

const TAG_STYLE: Record<EventTag, { border: string; badge: string; text: string; dot: string }> = {
  'Match':        { border: 'border-l-4 border-error',     badge: 'bg-error/10',     text: 'text-error',     dot: 'bg-error' },
  'Entraînement': { border: 'border-l-4 border-primary',   badge: 'bg-primary/10',   text: 'text-primary',   dot: 'bg-primary' },
  'Récupération': { border: 'border-l-4 border-secondary', badge: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  'Réunion':      { border: 'border-l-4 border-outline',   badge: 'bg-surface-container', text: 'text-on-surface', dot: 'bg-outline' },
};

const ADMIN_CLUB   = { nom: 'Metropolis United FC', ligue: 'Elite Pro League', annee: '1924', ville: 'London, UK' };
const ADMIN_SAISON = { label: '2026/2027', statut: 'En cours', competitions: 'Premier League · FA Cup', objectif: 'Top 4 · Quart FA Cup' };
const ADMIN_STAFF  = [
  { prenom: 'Thomas',  nom: 'Laurent',  role: 'Coach Principal' },
  { prenom: 'Sophie',  nom: 'Moreau',   role: 'Kinésithérapeute' },
  { prenom: 'David',   nom: 'Park',     role: 'Analyste Vidéo' },
  { prenom: 'Claire',  nom: 'Dupuis',   role: 'Médecin' },
  { prenom: 'Marcus',  nom: 'Osei',     role: 'Préparateur Physique' },
  { prenom: 'Julie',   nom: 'Renard',   role: 'Scout' },
  { prenom: 'Antoine', nom: 'Blanc',    role: 'Coach Adjoint' },
];

// ─── Composant ─────────────────────────────────────────────────────────────────

export default function DashboardMobile() {
  const { isAdmin } = useCurrentUser();
  const t = useT();

  const totalPlayers  = 6;
  const fitPlayers    = 3;
  const upcomingCount = UPCOMING_EVENTS.length;
  const unreadCount   = RECENT_MESSAGES.filter(m => m.unread).length;

  return (
    <div className="flex flex-col gap-6 pb-24">

      {/* En-tête */}
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t.dashboard.pageTitle}</p>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t.dashboard.greeting}, Alex</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: t.dashboard.kpiPlayers,  value: totalPlayers,  sub: `${fitPlayers} ${t.dashboard.kpiAvailable}`, Icon: Users,         accent: 'text-primary',   bg: 'bg-primary/5',   border: 'border-primary/20' },
          { label: t.dashboard.kpiEvents,   value: upcomingCount, sub: t.dashboard.kpiUpcoming,                  Icon: Calendar,      accent: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20' },
          { label: t.dashboard.kpiMessages, value: unreadCount,   sub: t.dashboard.kpiUnread,                    Icon: MessageSquare, accent: 'text-error',     bg: 'bg-error/5',     border: 'border-error/20' },
        ] as const).map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-4 flex flex-col gap-1.5`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{kpi.label}</p>
              <kpi.Icon size={16} className={kpi.accent} />
            </div>
            <p className={`text-3xl font-extrabold leading-none ${kpi.accent}`}>{kpi.value}</p>
            <p className="text-xs text-on-surface-variant">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Prochains événements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-base font-bold text-on-surface">{t.dashboard.upcomingEvents}</h2>
          </div>
          <a href="/calendrier" className="text-xs font-semibold text-primary flex items-center gap-0.5">
            {t.dashboard.viewAll} <ChevronRight size={13} />
          </a>
        </div>
        <div className="space-y-2">
          {UPCOMING_EVENTS.slice(0, 4).map(ev => {
            const ts = TAG_STYLE[ev.tag];
            return (
              <div key={ev.id}
                className={`flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ${ts.border}`}>
                <div className="shrink-0 text-center min-w-[48px]">
                  <p className="text-xs text-on-surface-variant font-semibold">{ev.date}</p>
                  <p className="text-sm font-extrabold text-on-surface">{ev.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{ev.title}</p>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                    <MapPin size={10} className="shrink-0" /><span className="truncate">{ev.lieu}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${ts.badge} ${ts.text}`}>{ev.tag}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Messages récents */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-on-surface-variant" />
            <h2 className="text-base font-bold text-on-surface">{t.dashboard.recentMessages}</h2>
          </div>
          <a href="/messagerie" className="text-xs font-semibold text-primary flex items-center gap-0.5">
            {t.dashboard.viewAll} <ChevronRight size={13} />
          </a>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl divide-y divide-outline-variant/50">
          {RECENT_MESSAGES.map(msg => (
            <div key={msg.id} className="flex items-start gap-3 p-4">
              <div className={`w-10 h-10 rounded-full ${msg.avatarBg} flex items-center justify-center text-sm font-bold ${msg.initBg} shrink-0 relative`}>
                <span>{msg.initials}</span>
                {msg.unread && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm font-bold truncate ${msg.unread ? 'text-on-surface' : 'text-on-surface-variant'}`}>{msg.name}</p>
                  <span className="text-xs text-on-surface-variant/60 shrink-0 ml-2">{msg.time}</span>
                </div>
                <p className={`text-xs truncate ${msg.unread ? 'text-on-surface-variant' : 'text-on-surface-variant/50'}`}>{msg.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Joueurs non disponibles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#F97316]" />
            <h2 className="text-base font-bold text-on-surface">{t.dashboard.unavailable}</h2>
          </div>
          <a href="/joueurs" className="text-xs font-semibold text-primary flex items-center gap-0.5">
            {t.dashboard.viewPlayersList} <ChevronRight size={13} />
          </a>
        </div>
        <div className="space-y-2">
          {PLAYERS_UNAVAILABLE.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
              <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-on-surface-variant">{p.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-bold text-on-surface">{p.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-xs text-on-surface-variant/70 truncate">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
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
            <a href="/administration" className="text-xs font-semibold text-error/80 flex items-center gap-0.5 shrink-0">
              {t.common.manage} <ChevronRight size={13} />
            </a>
          </div>
          <div className="border border-error/25 bg-error/5 rounded-2xl p-4 space-y-3">

            {/* Club */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t.dashboard.clubCard}</p>
              <p className="text-base font-extrabold text-on-surface">{ADMIN_CLUB.nom}</p>
              <p className="text-sm text-on-surface-variant mt-0.5">{ADMIN_CLUB.ligue}</p>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">{t.dashboard.founded} {ADMIN_CLUB.annee} · {ADMIN_CLUB.ville}</p>
            </div>

            {/* Saison */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t.dashboard.seasonCard}</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-extrabold text-on-surface">{ADMIN_SAISON.label}</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">{ADMIN_SAISON.statut}</span>
              </div>
              <p className="text-sm text-on-surface-variant">{ADMIN_SAISON.competitions}</p>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">{t.dashboard.objective} {ADMIN_SAISON.objectif}</p>
            </div>

            {/* Staff */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {t.dashboard.staffCard} · <span className="normal-case font-semibold text-on-surface">{ADMIN_STAFF.length} {t.common.members}</span>
              </p>
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {ADMIN_STAFF.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{s.prenom[0]}{s.nom[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{s.prenom} {s.nom}</p>
                      <p className="text-xs text-on-surface-variant truncate">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
