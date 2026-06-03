'use client';

import { Calendar, Users, MessageSquare, MapPin, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

// ─── Données mock ──────────────────────────────────────────────────────────────

const UPCOMING_EVENTS: { id: number; date: string; time: string; title: string; tag: EventTag; lieu: string }[] = [
  { id: 1, date: '05/06', time: '10:00', title: 'Pre-Match Training',    tag: 'Entraînement', lieu: 'Terrain principal' },
  { id: 2, date: '05/06', time: '15:00', title: 'Match Away',            tag: 'Match',        lieu: 'Etihad Stadium (extérieur)' },
  { id: 3, date: '07/06', time: '11:00', title: 'Tactical Analysis',     tag: 'Réunion',      lieu: 'Salle vidéo · Bâtiment B' },
  { id: 4, date: '09/06', time: '09:30', title: 'Gym Session',           tag: 'Entraînement', lieu: 'Salle de musculation' },
  { id: 5, date: '19/06', time: '17:00', title: 'Home Match',            tag: 'Match',        lieu: 'Stade principal (domicile)' },
];

const RECENT_MESSAGES: { id: number; initials: string; name: string; preview: string; time: string; unread: boolean; avatarBg: string; initBg: string }[] = [
  { id: 1, initials: '✦', name: 'Tactical AI',     preview: 'Le planning de la semaine prochaine est disponible.',  time: '8:06',  unread: true,  avatarBg: 'bg-primary',               initBg: 'text-white' },
  { id: 2, initials: 'CM', name: 'Coach Marcus',   preview: 'On reprend à 14h sur le terrain 2.',                   time: '10:45', unread: true,  avatarBg: 'bg-surface-container-high', initBg: 'text-on-surface-variant' },
  { id: 3, initials: 'SB', name: 'Sarah Bernard',  preview: 'Bilan médical de Julian R. après scanner.',            time: '9:12',  unread: false, avatarBg: 'bg-surface-container-high', initBg: 'text-on-surface-variant' },
  { id: 4, initials: 'ST', name: 'Staff Tactique', preview: 'Coach Marcus: Réunion demain 9h.',                     time: 'Hier',  unread: false, avatarBg: 'bg-primary/10',             initBg: 'text-primary' },
];

const PLAYERS_UNAVAILABLE = [
  { id: 2, initials: 'JR', name: 'Julian R.',  position: 'Arrière Gauche',    status: 'Blessé'   as const, detail: 'Ischio-jambiers · Dans 3 semaines' },
  { id: 5, initials: 'AM', name: 'Alex M.',    position: 'Défenseur Central', status: 'Suspendu' as const, detail: '2 matchs de suspension' },
  { id: 6, initials: 'TO', name: 'Tom O.',     position: 'Ailier Droit',      status: 'Incertain' as const, detail: 'Gêne musculaire cuisse' },
];

const STATUS_BADGE: Record<string, string> = {
  'Disponible': 'bg-secondary/10 text-secondary',
  'Blessé':     'bg-error/10 text-error',
  'Suspendu':   'bg-[#F97316]/10 text-[#F97316]',
  'Incertain':  'bg-primary/10 text-primary',
};

const TAG_STYLE: Record<EventTag, { border: string; badge: string; text: string }> = {
  'Match':        { border: 'border-l-4 border-error',     badge: 'bg-error/10',     text: 'text-error' },
  'Entraînement': { border: 'border-l-4 border-primary',   badge: 'bg-primary/10',   text: 'text-primary' },
  'Récupération': { border: 'border-l-4 border-secondary', badge: 'bg-secondary/10', text: 'text-secondary' },
  'Réunion':      { border: 'border-l-4 border-outline',   badge: 'bg-surface-container', text: 'text-on-surface' },
};

const ADMIN_CLUB    = { nom: 'Metropolis United FC', ligue: 'Elite Pro League', annee: '1924', ville: 'London, UK', email: 'admin@metropolisunited.com', phone: '+44 20 7946 0012', adresse: 'United Training Complex, SE1 7PB' };
const ADMIN_SAISON  = { label: '2026/2027', statut: 'En cours', competitions: 'Premier League · FA Cup', objectif: 'Top 4 · Quart FA Cup', debut: '01/08/2026', fin: '31/05/2027', journee: 38, journeeCourante: 15 };
const ADMIN_STAFF   = [
  { prenom: 'Thomas',  nom: 'Laurent',  role: 'Coach Principal' },
  { prenom: 'Sophie',  nom: 'Moreau',   role: 'Kinésithérapeute' },
  { prenom: 'David',   nom: 'Park',     role: 'Analyste Vidéo' },
  { prenom: 'Claire',  nom: 'Dupuis',   role: 'Médecin' },
  { prenom: 'Marcus',  nom: 'Osei',     role: 'Préparateur Physique' },
  { prenom: 'Julie',   nom: 'Renard',   role: 'Scout' },
  { prenom: 'Antoine', nom: 'Blanc',    role: 'Coach Adjoint' },
];

// ─── Composant ─────────────────────────────────────────────────────────────────

export default function DashboardDesktop() {
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  const totalPlayers   = 6;
  const fitPlayers     = 3;
  const upcomingCount  = UPCOMING_EVENTS.length;
  const unreadCount    = RECENT_MESSAGES.filter(m => m.unread).length;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Tableau de bord</p>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Bonjour, Alex Graham</h1>
          <p className="text-base text-on-surface-variant mt-1">Voici un résumé de l&apos;activité du club.</p>
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
          { label: 'Joueurs',      value: totalPlayers,  sub: `${fitPlayers} disponibles`, Icon: Users,         accent: 'text-primary',   bg: 'bg-primary/5',   border: 'border-primary/20' },
          { label: 'Événements',   value: upcomingCount, sub: 'à venir ce mois',           Icon: Calendar,      accent: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20' },
          { label: 'Messages',     value: unreadCount,   sub: 'non lus',                   Icon: MessageSquare, accent: 'text-error',     bg: 'bg-error/5',     border: 'border-error/20' },
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

        {/* Prochains événements */}
        <div className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-on-surface">Prochains événements</h2>
            </div>
            <a href="/calendrier" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Voir le calendrier <ChevronRight size={14} />
            </a>
          </div>
          <div className="space-y-2">
            {UPCOMING_EVENTS.map(ev => {
              const ts = TAG_STYLE[ev.tag];
              return (
                <div key={ev.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${ts.border} bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer`}>
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-xs font-bold text-on-surface-variant">{ev.date}</p>
                    <p className="text-base font-extrabold text-on-surface leading-tight">{ev.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{ev.title}</p>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                      <MapPin size={11} className="shrink-0" /><span className="truncate">{ev.lieu}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${ts.badge} ${ts.text}`}>{ev.tag}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages récents */}
        <div className="col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-on-surface-variant" />
              <h2 className="text-lg font-bold text-on-surface">Messages récents</h2>
            </div>
            <a href="/messagerie" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </a>
          </div>
          <div className="space-y-1">
            {RECENT_MESSAGES.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer">
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
        </div>
      </div>

      {/* Joueurs non disponibles */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-on-surface">Joueurs non disponibles</h2>
            <span className="text-xs text-on-surface-variant/60">
              {PLAYERS_UNAVAILABLE.length} joueur{PLAYERS_UNAVAILABLE.length > 1 ? 's' : ''} concerné{PLAYERS_UNAVAILABLE.length > 1 ? 's' : ''}
            </span>
          </div>
          <a href="/joueurs" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Voir la liste des joueurs <ChevronRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PLAYERS_UNAVAILABLE.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
              <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-on-surface-variant">{p.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-on-surface">{p.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">{p.position}</p>
                <p className="text-xs text-on-surface-variant/60 truncate">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau Admin */}
      {isAdmin && (
        <div className="border border-error/25 bg-error/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-error/80 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Vue administrateur</h2>
              <p className="text-xs text-on-surface-variant">Visible uniquement par les administrateurs</p>
            </div>
            <a href="/administration" className="ml-auto text-sm font-semibold text-error/80 hover:underline flex items-center gap-1">
              Gérer <ChevronRight size={14} />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4">

            {/* Club */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Club</p>
                <p className="text-base font-extrabold text-on-surface">{ADMIN_CLUB.nom}</p>
                <p className="text-sm text-on-surface-variant mt-1">{ADMIN_CLUB.ligue}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">Fondé en {ADMIN_CLUB.annee} · {ADMIN_CLUB.ville}</p>
              </div>
              <div className="border-t border-outline-variant pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest w-16 shrink-0">Email</span>
                  <span className="text-xs text-on-surface truncate">{ADMIN_CLUB.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest w-16 shrink-0">Tél.</span>
                  <span className="text-xs text-on-surface">{ADMIN_CLUB.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest w-16 shrink-0">Adresse</span>
                  <span className="text-xs text-on-surface">{ADMIN_CLUB.adresse}</span>
                </div>
              </div>
            </div>

            {/* Saison */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Saison active</p>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-base font-extrabold text-on-surface">{ADMIN_SAISON.label}</p>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">{ADMIN_SAISON.statut}</span>
                </div>
                <p className="text-sm text-on-surface-variant">{ADMIN_SAISON.competitions}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">Objectif : {ADMIN_SAISON.objectif}</p>
              </div>
              <div className="border-t border-outline-variant pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Début</span>
                  <span className="font-semibold text-on-surface">{ADMIN_SAISON.debut}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Fin</span>
                  <span className="font-semibold text-on-surface">{ADMIN_SAISON.fin}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-on-surface-variant">Avancement</span>
                    <span className="font-semibold text-on-surface">J{ADMIN_SAISON.journeeCourante} / {ADMIN_SAISON.journee}</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${Math.round((ADMIN_SAISON.journeeCourante / ADMIN_SAISON.journee) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Staff */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Staff · <span className="normal-case font-semibold text-on-surface">{ADMIN_STAFF.length} membres</span>
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
        </div>
      )}

    </div>
  );
}
