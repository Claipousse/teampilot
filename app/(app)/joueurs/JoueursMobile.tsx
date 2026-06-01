'use client';

import { useState } from 'react';
import { X, Pencil } from 'lucide-react';

type PlayerStatus = 'Disponible' | 'Blessé' | 'Suspendu' | 'Incertain';

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
  'Disponible': { badge: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', bg: 'bg-secondary/5 border-secondary/20', text: 'text-secondary' },
  'Blessé': { badge: 'bg-error/10 text-error', dot: 'bg-error', bg: 'bg-error/5 border-error/20', text: 'text-error' },
  'Suspendu': { badge: 'bg-[#F97316]/10 text-[#F97316]', dot: 'bg-[#F97316]', bg: 'bg-[#F97316]/5 border-[#F97316]/20', text: 'text-[#F97316]' },
  'Incertain': { badge: 'bg-primary/10 text-primary', dot: 'bg-primary', bg: 'bg-primary/5 border-primary/20', text: 'text-primary' },
};

const ph = (v: string | number | undefined) => (v !== undefined && v !== '') ? String(v) : '—';

const players: Player[] = [
  { id: 1, initials: 'MV', number: 8, name: 'Marcus V.', position: 'Milieu Central', positionShort: 'MIL', nationality: 'Anglais', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '15/03/1998', height: '182 cm', weight: '78 kg', foot: 'Droit', status: 'Disponible', contract: '30/06/2027', academy: 'Manchester Academy', stats: { matches: 22, goals: 4, assists: 9, yellowCards: 3, redCards: 0, minutes: 1850 }, notes: 'Excellent visionnaire du jeu.' },
  { id: 2, initials: 'JR', number: 3, name: 'Julian R.', position: 'Arrière Gauche', positionShort: 'DEF', nationality: 'Espagnol', flag: '🇪🇸', dob: '22/07/2000', height: '175 cm', weight: '72 kg', foot: 'Gauche', status: 'Blessé', injury: 'Ischio-jambiers', returnDate: 'Estimé dans 3 semaines', contract: '30/06/2025', academy: 'Atletico Madrid B', stats: { matches: 14, goals: 0, assists: 3, yellowCards: 2, redCards: 0, minutes: 1170 }, notes: "Récupération en bonne voie." },
  { id: 3, initials: 'KL', number: 9, name: 'Kevin L.', position: 'Attaquant Centre', positionShort: 'ATT', nationality: 'Français', flag: '🇫🇷', dob: '08/11/1996', height: '186 cm', weight: '82 kg', foot: 'Droit', status: 'Disponible', contract: '30/06/2028', academy: 'OL Academy', stats: { matches: 22, goals: 11, assists: 4, yellowCards: 1, redCards: 0, minutes: 1940 }, notes: 'En grande forme.' },
  { id: 4, initials: 'SK', number: 1, name: 'Stefan K.', position: 'Gardien de but', positionShort: 'GK', nationality: 'Allemand', flag: '🇩🇪', dob: '14/05/1995', height: '192 cm', weight: '88 kg', foot: 'Droit', status: 'Disponible', contract: '30/06/2028', academy: 'Bayern Youth', stats: { matches: 22, cleanSheets: 9, goalsConceded: 18, minutes: 1980 }, notes: 'Fiable sur toute la ligne.' },
  { id: 5, initials: 'AM', number: 5, name: 'Alex M.', position: 'Défenseur Central', positionShort: 'DEF', nationality: 'Brésilien', flag: '🇧🇷', dob: '30/01/1997', height: '188 cm', weight: '84 kg', foot: 'Droit', status: 'Suspendu', injury: '2 matchs de suspension', contract: '30/06/2026', academy: 'Flamengo Youth', stats: { matches: 19, goals: 2, assists: 1, yellowCards: 5, redCards: 1, minutes: 1710 }, notes: 'Doit gérer son agressivité.' },
  { id: 6, initials: 'TO', number: 11, name: 'Tom O.', position: 'Ailier Droit', positionShort: 'ATT', nationality: 'Anglais', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '19/09/2001', height: '178 cm', weight: '74 kg', foot: 'Gauche', status: 'Incertain', injury: 'Gêne musculaire cuisse', returnDate: 'Décision avant le match', contract: '30/06/2027', academy: 'Chelsea Academy', stats: { matches: 18, goals: 6, assists: 7, yellowCards: 1, redCards: 0, minutes: 1420 }, notes: 'À surveiller avant le prochain match.' },
];

const POSITIONS = ['Tous', 'GK', 'DEF', 'MIL', 'ATT'] as const;

function contractColor(date?: string): string {
  if (!date) return 'text-on-surface-variant';
  const [, m, y] = date.split('/').map(Number);
  const months = (y - 2026) * 12 + (m - 6);
  if (months < 0) return 'text-error font-bold';
  if (months < 12) return 'text-[#F97316] font-bold';
  return 'text-secondary font-semibold';
}

export default function JoueursMobile() {
  const [posFilter, setPosFilter] = useState<typeof POSITIONS[number]>('Tous');
  const [displayed, setDisplayed] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const openModal = (p: Player) => {
    setDisplayed(p);
    if (notes[p.id] === undefined) setNotes(prev => ({ ...prev, [p.id]: p.notes ?? '' }));
    setTimeout(() => setModalVisible(true), 10);
  };
  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setDisplayed(null), 300);
  };

  const filtered = players.filter(p => posFilter === 'Tous' || p.positionShort === posFilter);
  const counts = {
    Disponible: players.filter(p => p.status === 'Disponible').length,
    Blessé: players.filter(p => p.status === 'Blessé').length,
    Suspendu: players.filter(p => p.status === 'Suspendu').length,
    Incertain: players.filter(p => p.status === 'Incertain').length,
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Effectif</h1>
        <button className="px-4 py-2.5 bg-error rounded-xl text-white text-base font-bold active:scale-[0.98] transition-all">
          + Ajouter
        </button>
      </div>

      {/* Statuts pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="text-base font-bold text-secondary">Disponibles : {counts.Disponible}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-error" />
          <span className="text-base font-bold text-error">Blessés : {counts.Blessé}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
          <span className="text-base font-bold text-[#F97316]">Suspendus : {counts.Suspendu}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-base font-bold text-primary">Incertains : {counts.Incertain}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${posFilter === pos ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
            {pos}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map(player => {
          const s = S[player.status];
          return (
            <div key={player.id} onClick={() => openModal(player)}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center">
                    <span className="text-xl font-bold text-on-surface-variant">{player.initials}</span>
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-primary rounded-lg px-1.5 py-0.5">
                    <span className="text-white text-xs font-bold">#{player.number}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-on-surface">{player.name}</p>
                  <p className="text-base text-on-surface-variant">{player.position}</p>
                  <p className="text-base text-on-surface-variant">{player.flag} {player.nationality}</p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-base font-extrabold shrink-0 ${s.badge}`}>
                  {player.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backdrop */}
      {displayed && (
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ willChange: 'opacity, backdrop-filter' }}
          onClick={closeModal}
        />
      )}

      {/* Modal */}
      {displayed && (() => {
        const s = S[displayed.status];
        const st = displayed.stats ?? {};
        return (
          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-300 ${modalVisible ? 'translate-y-0' : 'translate-y-full'}`}>

            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center">
                    <span className="text-xl font-bold text-on-surface-variant">{displayed.initials}</span>
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-primary rounded-lg px-1.5 py-0.5">
                    <span className="text-white text-xs font-bold">#{displayed.number}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-on-surface">{displayed.name}</p>
                  <p className="text-base text-on-surface-variant">{displayed.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-error text-white text-base font-semibold rounded-xl">
                  <Pencil size={15} /> Modifier
                </button>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container">
                  <X size={20} className="text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Statut */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${s.bg}`}>
                <div className={`w-3 h-3 rounded-full ${s.dot} shrink-0`} />
                <div>
                  <p className={`text-lg font-bold ${s.text}`}>{displayed.status}</p>
                  {displayed.injury && <p className="text-base text-on-surface-variant">{displayed.injury}</p>}
                  {displayed.returnDate && <p className="text-base text-on-surface-variant">↩ {displayed.returnDate}</p>}
                </div>
              </div>

              {/* Infos perso */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Informations personnelles</p>
                <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                  {[
                    { label: 'Nationalité', value: displayed.nationality ? `${displayed.flag} ${displayed.nationality}` : undefined },
                    { label: 'Naissance', value: displayed.dob },
                    { label: 'Taille', value: displayed.height },
                    { label: 'Poids', value: displayed.weight },
                    { label: 'Pied', value: displayed.foot },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5">
                      <p className="text-base text-on-surface-variant">{item.label}</p>
                      <p className={`text-base font-semibold ${item.value ? 'text-on-surface' : 'text-outline'}`}>{ph(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Statistiques · 2026–2027</p>
                {displayed.positionShort === 'GK' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Matchs', value: st.matches, color: 'text-on-surface' },
                      { label: 'CS', value: st.cleanSheets, color: 'text-secondary' },
                      { label: 'Encaissés', value: st.goalsConceded, color: 'text-error' },
                      { label: 'Minutes', value: st.minutes ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                        <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                        <p className="text-base text-on-surface-variant mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Matchs', value: st.matches, color: 'text-on-surface' },
                      { label: 'Buts', value: st.goals, color: 'text-primary' },
                      { label: 'Passes', value: st.assists, color: 'text-secondary' },
                      { label: '🟨', value: st.yellowCards, color: 'text-[#F97316]' },
                      { label: '🟥', value: st.redCards, color: 'text-error' },
                      { label: 'Minutes', value: st.minutes ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                        <p className={`text-3xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                        <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contrat */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Contrat</p>
                <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="text-base text-on-surface-variant">Expire le</p>
                    <p className={`text-base ${displayed.contract ? contractColor(displayed.contract) : 'text-outline'}`}>{ph(displayed.contract)}</p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="text-base text-on-surface-variant">Club formateur</p>
                    <p className={`text-base font-semibold ${displayed.academy ? 'text-on-surface' : 'text-outline'}`}>{ph(displayed.academy)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Notes du coach</p>
                <textarea
                  value={notes[displayed.id] ?? (displayed.notes ?? '')}
                  onChange={e => setNotes(prev => ({ ...prev, [displayed.id]: e.target.value }))}
                  rows={4}
                  placeholder="Ajouter une note..."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-2xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="h-14" />
            </div>
          </div>
        );
      })()}

    </div>
  );
}