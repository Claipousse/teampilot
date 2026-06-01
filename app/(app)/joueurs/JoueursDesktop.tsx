'use client';

import { useState } from 'react';
import { Search, X, Pencil } from 'lucide-react';

type PlayerStatus = 'Disponible' | 'Blessé' | 'Suspendu' | 'Incertain';
type PositionFilter = 'Tous' | 'GK' | 'DEF' | 'MIL' | 'ATT';

type Player = {
  id: number;
  initials: string;
  number: number;
  name: string;
  position: string;
  positionShort: 'GK' | 'DEF' | 'MIL' | 'ATT';
  nationality?: string;
  flag?: string;
  dob?: string;
  height?: string;
  weight?: string;
  foot?: string;
  status: PlayerStatus;
  injury?: string;
  returnDate?: string;
  contract?: string;
  academy?: string;
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
    minutes?: number;
    cleanSheets?: number;
    goalsConceded?: number;
  };
  notes?: string;
};

const S: Record<PlayerStatus, { badge: string; dot: string; bg: string; text: string }> = {
  'Disponible': { badge: 'bg-secondary/10 text-secondary',  dot: 'bg-secondary', bg: 'bg-secondary/5 border-secondary/20',  text: 'text-secondary' },
  'Blessé':     { badge: 'bg-error/10 text-error',          dot: 'bg-error',     bg: 'bg-error/5 border-error/20',          text: 'text-error' },
  'Suspendu':   { badge: 'bg-[#F97316]/10 text-[#F97316]',  dot: 'bg-[#F97316]', bg: 'bg-[#F97316]/5 border-[#F97316]/20', text: 'text-[#F97316]' },
  'Incertain':  { badge: 'bg-primary/10 text-primary',      dot: 'bg-primary',   bg: 'bg-primary/5 border-primary/20',     text: 'text-primary' },
};

const ph = (v: string | number | undefined) =>
  v !== undefined && v !== '' ? String(v) : '—';

const players: Player[] = [
  { id: 1, initials: 'MV', number: 8,  name: 'Marcus V.',  position: 'Milieu Central',    positionShort: 'MIL', nationality: 'Anglais',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '15/03/1998', height: '182 cm', weight: '78 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2027', academy: 'Manchester Academy', stats: { matches: 22, goals: 4,  assists: 9, yellowCards: 3, redCards: 0, minutes: 1850 }, notes: 'Excellent visionnaire du jeu.' },
  { id: 2, initials: 'JR', number: 3,  name: 'Julian R.',  position: 'Arrière Gauche',    positionShort: 'DEF', nationality: 'Espagnol',  flag: '🇪🇸', dob: '22/07/2000', height: '175 cm', weight: '72 kg', foot: 'Gauche', status: 'Blessé',     injury: 'Ischio-jambiers', returnDate: 'Dans 3 semaines', contract: '30/06/2025', academy: 'Atletico Madrid B', stats: { matches: 14, goals: 0, assists: 3, yellowCards: 2, redCards: 0, minutes: 1170 }, notes: 'Récupération en bonne voie.' },
  { id: 3, initials: 'KL', number: 9,  name: 'Kevin L.',   position: 'Attaquant Centre',  positionShort: 'ATT', nationality: 'Français',  flag: '🇫🇷', dob: '08/11/1996', height: '186 cm', weight: '82 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2028', academy: 'OL Academy',          stats: { matches: 22, goals: 11, assists: 4, yellowCards: 1, redCards: 0, minutes: 1940 }, notes: 'Meilleur buteur de la saison.' },
  { id: 4, initials: 'SK', number: 1,  name: 'Stefan K.',  position: 'Gardien de but',    positionShort: 'GK',  nationality: 'Allemand',  flag: '🇩🇪', dob: '14/05/1995', height: '192 cm', weight: '88 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2028', academy: 'Bayern Youth',        stats: { matches: 22, cleanSheets: 9, goalsConceded: 18, minutes: 1980 },               notes: 'Fiable sur toute la ligne.' },
  { id: 5, initials: 'AM', number: 5,  name: 'Alex M.',    position: 'Défenseur Central', positionShort: 'DEF', nationality: 'Brésilien', flag: '🇧🇷', dob: '30/01/1997', height: '188 cm', weight: '84 kg', foot: 'Droit',  status: 'Suspendu',   injury: '2 matchs de suspension', contract: '30/06/2026', academy: 'Flamengo Youth',      stats: { matches: 19, goals: 2, assists: 1, yellowCards: 5, redCards: 1, minutes: 1710 },  notes: 'Doit gérer son agressivité.' },
  { id: 6, initials: 'TO', number: 11, name: 'Tom O.',     position: 'Ailier Droit',      positionShort: 'ATT', nationality: 'Anglais',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '19/09/2001', height: '178 cm', weight: '74 kg', foot: 'Gauche', status: 'Incertain',  injury: 'Gêne musculaire cuisse', returnDate: 'Décision avant le match', contract: '30/06/2027', academy: 'Chelsea Academy', stats: { matches: 18, goals: 6, assists: 7, yellowCards: 1, redCards: 0, minutes: 1420 }, notes: 'À surveiller avant le prochain match.' },
];

const POSITIONS: PositionFilter[] = ['Tous', 'GK', 'DEF', 'MIL', 'ATT'];
const STATUSES: (PlayerStatus | 'Tous')[] = ['Tous', 'Disponible', 'Blessé', 'Suspendu', 'Incertain'];

function contractColor(date?: string): string {
  if (!date) return 'text-on-surface-variant';
  const [, m, y] = date.split('/').map(Number);
  const months = (y - 2026) * 12 + (m - 6);
  if (months < 0)  return 'text-error font-bold';
  if (months < 12) return 'text-[#F97316] font-bold';
  return 'text-secondary font-semibold';
}

export default function JoueursDesktop() {
  const [posFilter, setPosFilter]       = useState<PositionFilter>('Tous');
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | 'Tous'>('Tous');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Player | null>(null);
  const [displayed, setDisplayed]       = useState<Player | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [notes, setNotes]               = useState<Record<number, string>>({});

  const open = (p: Player) => {
    setDisplayed(p); setSelected(p);
    if (notes[p.id] === undefined) setNotes(prev => ({ ...prev, [p.id]: p.notes ?? '' }));
    setTimeout(() => setPanelVisible(true), 10);
  };
  const close = () => {
    setPanelVisible(false);
    setTimeout(() => { setSelected(null); setDisplayed(null); }, 300);
  };

  const filtered = players.filter(p =>
    (posFilter === 'Tous' || p.positionShort === posFilter) &&
    (statusFilter === 'Tous' || p.status === statusFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.position.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    Disponible: players.filter(p => p.status === 'Disponible').length,
    Blessé:     players.filter(p => p.status === 'Blessé').length,
    Suspendu:   players.filter(p => p.status === 'Suspendu').length,
    Incertain:  players.filter(p => p.status === 'Incertain').length,
  };

  const PANEL_W = 'w-[320px] xl:w-[400px] panel-detail';

  return (
    <div className="flex gap-5 h-full overflow-hidden">

      {/* ── Liste ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-on-surface shrink-0">Effectif</h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white text-base font-semibold rounded-xl transition-colors shrink-0">
            + Ajouter un joueur
          </button>
        </div>

        {/* Statuts — 2×2 par défaut, 1×4 sur très grands écrans */}
        <div className="grid grid-cols-2 3xl:grid-cols-4 gap-3">
          {([
            { label: 'Disponibles', count: counts.Disponible, s: S['Disponible'] },
            { label: 'Blessés',     count: counts.Blessé,     s: S['Blessé'] },
            { label: 'Suspendus',   count: counts.Suspendu,   s: S['Suspendu'] },
            { label: 'Incertains',  count: counts.Incertain,  s: S['Incertain'] },
          ] as const).map((item, i) => (
            <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${item.s.bg}`}>
              <div className={`w-3 h-3 rounded-full ${item.s.dot} shrink-0`} />
              <p className={`text-3xl font-extrabold ${item.s.text}`}>{item.count}</p>
              <p className={`text-xl font-bold ${item.s.text}`}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
            {POSITIONS.map(pos => (
              <button key={pos} onClick={() => setPosFilter(pos)}
                className={`px-4 py-2 rounded-lg text-base font-bold transition-all ${posFilter === pos ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {pos}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
            {STATUSES.map(st => (
              <button key={st} onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === st ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {st}
              </button>
            ))}
          </div>
          <p className="text-base text-on-surface-variant ml-auto">
            {filtered.length} joueur{filtered.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Grille joueurs */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(player => {
            const s = S[player.status];
            return (
              <div key={player.id} onClick={() => open(player)}
                className={`bg-surface-container-lowest border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === player.id ? 'border-primary shadow-md' : 'border-outline-variant'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <span className="text-2xl font-bold text-on-surface-variant">{player.initials}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-lg px-1.5 py-0.5">
                      <span className="text-white text-sm font-bold">#{player.number}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-on-surface">{player.name}</p>
                    <p className="text-base text-on-surface-variant">{player.position}</p>
                    <p className="text-base text-on-surface-variant">{player.flag} {player.nationality}</p>
                  </div>
                  <span className={`px-4 py-2.5 rounded-xl text-base font-extrabold shrink-0 ${s.badge}`}>
                    {player.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panneau détail ── */}
      <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
        panelVisible ? `${PANEL_W} opacity-100` : 'w-0 opacity-0'
      }`}>
        {displayed && (() => {
          const s = S[displayed.status];
          const st = displayed.stats ?? {};
          return (
            <div className={`${PANEL_W} h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden`}>

              {/* Header panneau */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <button onClick={close} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={20} className="text-on-surface-variant" />
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white text-base font-semibold rounded-xl transition-colors">
                  <Pencil size={16} /> Modifier
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">

                {/* Profil */}
                <div className="p-5 border-b border-outline-variant">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center">
                        <span className="text-3xl font-bold text-on-surface-variant">{displayed.initials}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-primary rounded-xl px-2 py-1">
                        <span className="text-white text-base font-bold">#{displayed.number}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-on-surface">{displayed.name}</p>
                      <p className="text-base text-on-surface-variant mb-3">{displayed.position}</p>
                      <span className={`px-4 py-2 rounded-xl text-base font-extrabold ${s.badge}`}>
                        {displayed.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">

                  {/* Infos perso */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Informations personnelles</p>
                    <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                      {[
                        { label: 'Nationalité',  value: displayed.nationality ? `${displayed.flag} ${displayed.nationality}` : undefined },
                        { label: 'Naissance',    value: displayed.dob },
                        { label: 'Taille',       value: displayed.height },
                        { label: 'Poids',        value: displayed.weight },
                        { label: 'Pied préféré', value: displayed.foot },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3.5">
                          <p className="text-base text-on-surface-variant">{item.label}</p>
                          <p className={`text-base font-semibold ${item.value ? 'text-on-surface' : 'text-outline'}`}>
                            {ph(item.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Statistiques · 2026–2027</p>
                    {displayed.positionShort === 'GK' ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Matchs',    value: st.matches,        color: 'text-on-surface' },
                          { label: 'CS',        value: st.cleanSheets,    color: 'text-secondary' },
                          { label: 'Encaissés', value: st.goalsConceded,  color: 'text-error' },
                          { label: 'Minutes',   value: st.minutes !== undefined ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                            <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>
                              {ph(stat.value)}
                            </p>
                            <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Matchs',   value: st.matches,      color: 'text-on-surface' },
                          { label: 'Buts',     value: st.goals,        color: 'text-primary' },
                          { label: 'Passes',   value: st.assists,      color: 'text-secondary' },
                          { label: '🟨',       value: st.yellowCards,  color: 'text-[#F97316]' },
                          { label: '🟥',       value: st.redCards,     color: 'text-error' },
                          { label: 'Minutes',  value: st.minutes !== undefined ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                            <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>
                              {ph(stat.value)}
                            </p>
                            <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Statut médical */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Statut médical</p>
                    <div className={`rounded-2xl p-4 border ${s.bg}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-3 h-3 rounded-full ${s.dot} shrink-0`} />
                        <p className={`text-lg font-bold ${s.text}`}>{displayed.status}</p>
                      </div>
                      {displayed.injury     && <p className="text-base text-on-surface-variant ml-6">{displayed.injury}</p>}
                      {displayed.returnDate && <p className="text-base text-on-surface-variant ml-6 mt-1">↩ {displayed.returnDate}</p>}
                    </div>
                  </div>

                  {/* Contrat */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Contrat</p>
                    <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <p className="text-base text-on-surface-variant">Expire le</p>
                        <p className={`text-base ${displayed.contract ? contractColor(displayed.contract) : 'text-outline'}`}>
                          {ph(displayed.contract)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <p className="text-base text-on-surface-variant">Club formateur</p>
                        <p className={`text-base font-semibold ${displayed.academy ? 'text-on-surface' : 'text-outline'}`}>
                          {ph(displayed.academy)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Notes du coach</p>
                    <textarea
                      value={notes[displayed.id] ?? (displayed.notes ?? '')}
                      onChange={e => setNotes(prev => ({ ...prev, [displayed.id]: e.target.value }))}
                      rows={4}
                      placeholder="Ajouter une note..."
                      className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-2xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>

                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}