'use client';

import { useState } from 'react';
import { X, BarChart3 } from 'lucide-react';

type Player = {
  id: number;
  initials: string;
  name: string;
  position: string;
  category: string;
  number: string;
  formScore: number;
  formColor: string;
  status: string;
  statusBg: string;
  statusColor: string;
  charge?: string;
  intensite?: string;
  sleep: number;
  fuel: number;
  recovery: number;
  projectedIntensity: string;
  aerobicCapacity: string;
  matchReadiness: number;
};

const players: Player[] = [
  {
    id: 1, initials: 'KM', name: 'K. Mbappé', position: 'ATT', category: 'ATT', number: '10',
    formScore: 64, formColor: 'text-error',
    status: 'FATIGUÉ', statusBg: 'bg-[#F97316]/10', statusColor: 'text-[#F97316]',
    sleep: 6.1, fuel: 72, recovery: 45,
    projectedIntensity: 'Low (Level 2)', aerobicCapacity: 'At Risk', matchReadiness: 40,
  },
  {
    id: 2, initials: 'AG', name: 'A. Griezmann', position: 'MIL', category: 'MIL', number: '07',
    formScore: 92, formColor: 'text-secondary',
    status: 'OPTIMAL', statusBg: 'bg-secondary/10', statusColor: 'text-secondary',
    charge: '12.4 km/sem', intensite: 'Élevée',
    sleep: 8.5, fuel: 95, recovery: 90,
    projectedIntensity: 'Elite (Level 5)', aerobicCapacity: 'Optimal', matchReadiness: 96,
  },
  {
    id: 3, initials: 'WS', name: 'W. Saliba', position: 'DEF', category: 'DEF', number: '12',
    formScore: 88, formColor: 'text-secondary',
    status: 'OPTIMAL', statusBg: 'bg-secondary/10', statusColor: 'text-secondary',
    charge: '9.8 km/sem', intensite: 'Stable',
    sleep: 8.2, fuel: 88, recovery: 84,
    projectedIntensity: 'High (Level 4)', aerobicCapacity: 'Good', matchReadiness: 91,
  },
  {
    id: 4, initials: 'TH', name: 'T. Hernandez', position: 'DEF', category: 'DEF', number: '21',
    formScore: 71, formColor: 'text-[#F97316]',
    status: 'À SURVEILLER', statusBg: 'bg-[#F97316]/10', statusColor: 'text-[#F97316]',
    sleep: 7.0, fuel: 78, recovery: 62,
    projectedIntensity: 'Medium (Level 3)', aerobicCapacity: 'Caution', matchReadiness: 68,
  },
];

const filters = ['TOUS', 'DEF', 'MIL', 'ATT', 'GDK'];

export default function JoueursMobile() {
  const [activeFilter, setActiveFilter] = useState('TOUS');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [displayedPlayer, setDisplayedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (player: Player) => {
    setDisplayedPlayer(player);
    setSelectedPlayer(player);
    setTimeout(() => setModalVisible(true), 10);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedPlayer(null);
      setDisplayedPlayer(null);
    }, 300);
  };

  const filtered = activeFilter === 'TOUS'
    ? players
    : players.filter(p => p.category === activeFilter);

  const fitCount = players.filter(p => p.status === 'OPTIMAL').length;
  const fatigueCount = players.filter(p => p.status === 'FATIGUÉ').length;
  const lesionCount = players.filter(p => p.status === 'À SURVEILLER').length;

  return (
    <div className="space-y-5">

      {/* Titre */}
      <h1 className="text-3xl font-extrabold text-on-surface">Équipe</h1>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-sm font-bold text-secondary">FIT : {fitCount}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#F97316]" />
          <span className="text-sm font-bold text-[#F97316]">FATIGUE : {fatigueCount}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-error" />
          <span className="text-sm font-bold text-error">LÉSION : {lesionCount}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeFilter === f
                ? 'bg-primary text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cartes joueurs */}
      <div className="space-y-4">
        {filtered.map(player => (
          <div
            key={player.id}
            onClick={() => openModal(player)}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-start gap-4 mb-3">
              <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-on-surface-variant">{player.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-on-surface">{player.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${player.statusBg} ${player.statusColor}`}>
                    {player.status}
                  </span>
                  <span className="text-sm text-on-surface-variant font-semibold">{player.position}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-3xl font-extrabold ${player.formColor}`}>{player.formScore}%</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Forme</p>
              </div>
            </div>

            {player.charge && player.intensite && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Charge</p>
                  <p className="text-base font-bold text-on-surface">{player.charge}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Intensité</p>
                  <p className="text-base font-bold text-on-surface">{player.intensite}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Backdrop */}
      {displayedPlayer && (
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ willChange: 'opacity, backdrop-filter' }}
          onClick={closeModal}
        />
      )}

      {/* Modal */}
      {displayedPlayer && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden transition-transform duration-300 ${
            modalVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-outline-variant rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="text-xl font-bold text-on-surface-variant">{displayedPlayer.initials}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">{displayedPlayer.name}</p>
                <p className="text-sm font-semibold text-primary">N° {displayedPlayer.number}</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <X size={20} className="text-on-surface-variant" />
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Données Physiologiques
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '🌙 Sommeil', value: displayedPlayer.sleep, unit: 'h', pct: (displayedPlayer.sleep / 10) * 100, color: 'bg-primary', warn: false },
                  { label: '🍽 Carburant', value: displayedPlayer.fuel, unit: '%', pct: displayedPlayer.fuel, color: 'bg-secondary', warn: false },
                  { label: '🔄 Récup.', value: displayedPlayer.recovery, unit: '%', pct: displayedPlayer.recovery, color: displayedPlayer.recovery < 60 ? 'bg-error' : 'bg-secondary', warn: displayedPlayer.recovery < 60 },
                ].map((item, i) => (
                  <div key={i} className="bg-surface-container rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant mb-1">{item.label}</p>
                    <p className={`text-xl font-bold ${item.warn ? 'text-error' : 'text-on-surface'}`}>
                      {item.value}<span className="text-xs font-normal">{item.unit}</span>
                    </p>
                    <div className="h-1.5 bg-surface-container-high rounded-full mt-2">
                      <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Prédiction (7 prochains jours)
              </p>
              <div className="bg-inverse-surface rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Intensité Projetée</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xl font-bold text-white">{displayedPlayer.projectedIntensity}</p>
                  <BarChart3 size={22} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-base">
                    <span className="text-white/60">Capacité Aérobique</span>
                    <span className={`font-semibold ${
                      displayedPlayer.aerobicCapacity === 'Optimal' ? 'text-secondary-fixed-dim' :
                      displayedPlayer.aerobicCapacity === 'Good' ? 'text-primary-fixed-dim' :
                      'text-error'
                    }`}>
                      {displayedPlayer.aerobicCapacity}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-white/60">Prêt pour le match</span>
                    <span className="font-semibold text-white">{displayedPlayer.matchReadiness}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-outline-variant shrink-0">
            <button className="w-full py-4 border-2 border-primary rounded-xl text-base font-bold text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
              Rapport Complet
            </button>
          </div>

        </div>
      )}

    </div>
  );
}