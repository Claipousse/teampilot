'use client';

import { useState } from 'react';
import {
  Search, SlidersHorizontal, X, Pencil,
  AlertTriangle, Zap, ChevronDown, BarChart3,
} from 'lucide-react';

const players = [
  {
    id: 1, name: 'Marcus V.', position: 'Central Midfielder', number: '08',
    formScore: 94, formColor: 'text-secondary', status: 'FIT', statusColor: 'bg-secondary',
    tags: ['CM', 'REGISTA'], trend: '+2.4%', trendColor: 'text-secondary',
    insight: 'AI: Peak performance projected for Matchday', insightIcon: '✦',
    initials: 'MV', sleep: 8.2, fuel: 94, recovery: 76,
    projectedIntensity: 'Elite (Level 5)', aerobicCapacity: 'Optimal', matchReadiness: 98,
    aiInsight: 'Marcus shows high cognitive load from recent high-intensity regressive sessions. Recommendation: Reduce tactical briefing time by 15% and prioritize 15min low-impact recovery pool session post-training today.',
  },
  {
    id: 2, name: 'Julian R.', position: 'Left Back', number: '03',
    formScore: 62, formColor: 'text-error', status: 'FATIGUE', statusColor: 'bg-tertiary-container',
    tags: ['LB', 'LWB'], trend: '-1.2%', trendColor: 'text-error',
    insight: 'AI: High injury risk (Hamstring)', insightIcon: '⚠', alert: true,
    initials: 'JR', sleep: 6.1, fuel: 72, recovery: 45,
    projectedIntensity: 'Low (Level 2)', aerobicCapacity: 'At Risk', matchReadiness: 40,
    aiInsight: 'Julian shows signs of hamstring fatigue. Recommendation: Immediate reduction in sprint-based drills and physiotherapy assessment before next match.',
  },
  {
    id: 3, name: 'Kevin L.', position: 'Striker', number: '09',
    formScore: 81, formColor: 'text-on-surface', status: 'FIT', statusColor: 'bg-secondary',
    tags: ['ST', 'CF'], trend: 'STABLE', trendColor: 'text-on-surface-variant',
    insight: 'Tactical Match: High pressing efficiency', insightIcon: '✓',
    initials: 'KL', sleep: 7.8, fuel: 88, recovery: 82,
    projectedIntensity: 'High (Level 4)', aerobicCapacity: 'Good', matchReadiness: 85,
    aiInsight: 'Kevin maintains strong pressing metrics. Recommendation: Maintain current training load with focus on finishing drills ahead of next match.',
  },
  {
    id: 4, name: 'Stefan K.', position: 'Goalkeeper', number: '01',
    formScore: 88, formColor: 'text-secondary', status: 'FIT', statusColor: 'bg-secondary',
    tags: ['GK', 'SWEEPER'], trend: '+0.8%', trendColor: 'text-secondary',
    insight: 'Alert: High distribution accuracy this week', insightIcon: '⚡',
    initials: 'SK', sleep: 8.5, fuel: 91, recovery: 88,
    projectedIntensity: 'Elite (Level 5)', aerobicCapacity: 'Optimal', matchReadiness: 96,
    aiInsight: 'Stefan is performing at peak level. Recommendation: Distribution accuracy up 12% from last week. Maintain current training regimen.',
  },
];

type Player = typeof players[0];

export default function JoueursDesktop() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(players[0]);
  const [displayedPlayer, setDisplayedPlayer] = useState<Player | null>(players[0]);
  const [panelVisible, setPanelVisible] = useState(true);
  const [search, setSearch] = useState('');

  const openPanel = (player: Player) => {
    setDisplayedPlayer(player);
    setSelectedPlayer(player);
    setPanelVisible(true);
  };

  const closePanel = () => {
    setPanelVisible(false);
    setTimeout(() => {
      setSelectedPlayer(null);
      setDisplayedPlayer(null);
    }, 300);
  };

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-5 h-full">

      {/* Liste joueurs */}
      <div className="flex-1 min-w-0">

        <div className="flex items-center gap-4 mb-5">
          <h1 className="text-3xl font-bold text-on-surface shrink-0">Player Management</h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              type="text"
              placeholder="Search by name, position or metrics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-5 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
          {[
            { label: 'Position', value: 'All Positions' },
            { label: 'Availability', value: 'Full Squad' },
            { label: 'Sort By', value: 'Form Score' },
          ].map((filter, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-8 bg-outline-variant" />}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{filter.label}</span>
                <button className="flex items-center gap-1 text-base font-semibold text-on-surface">
                  {filter.value} <ChevronDown size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="w-px h-8 bg-outline-variant" />
          <button className="flex items-center gap-2 ml-auto text-base font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            <SlidersHorizontal size={18} /> Advanced
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map(player => (
            <div
              key={player.id}
              onClick={() => openPanel(player)}
              className={`bg-surface-container-lowest border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                selectedPlayer?.id === player.id ? 'border-primary shadow-md' : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-on-surface-variant">{player.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-on-surface">{player.name}</p>
                  <p className="text-base text-on-surface-variant">{player.position}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-4xl font-extrabold ${player.formColor}`}>{player.formScore}</p>
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider">Form Score</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${player.statusColor}`}>{player.status}</span>
                {player.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm font-bold bg-surface-container text-on-surface-variant">{tag}</span>
                ))}
                <span className={`text-sm font-bold ml-auto ${player.trendColor}`}>{player.trend}</span>
              </div>
              {player.alert ? (
                <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
                  <AlertTriangle size={16} className="text-error shrink-0" />
                  <p className="text-sm font-semibold text-error">{player.insight}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl">
                  <span className="text-primary text-sm">{player.insightIcon}</span>
                  <p className="text-sm text-on-surface-variant">{player.insight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit animé */}
      <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
        panelVisible ? 'w-[360px] xl:w-[420px] opacity-100' : 'w-0 opacity-0'
      }`}>
        {displayedPlayer && (
          <div className="w-[360px] xl:w-[420px] h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden">

            <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0">
              <button onClick={closePanel} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                <X size={20} className="text-on-surface-variant" />
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-colors">
                <Pencil size={16} /> Edit Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-on-surface-variant">{displayedPlayer.initials}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-on-surface">{displayedPlayer.name}</p>
                  <p className="text-base font-semibold text-primary">Squad Number: {displayedPlayer.number}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Physiological Data</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '🌙 Sleep', value: displayedPlayer.sleep, unit: 'h', color: 'bg-primary', pct: (displayedPlayer.sleep / 10) * 100 },
                    { label: '🍽 Fuel', value: displayedPlayer.fuel, unit: '%', color: 'bg-secondary', pct: displayedPlayer.fuel },
                    { label: '🔄 Recovery', value: displayedPlayer.recovery, unit: '%', color: displayedPlayer.recovery < 60 ? 'bg-error' : 'bg-secondary', pct: displayedPlayer.recovery, warn: displayedPlayer.recovery < 60 },
                  ].map((item, i) => (
                    <div key={i} className="bg-surface-container rounded-xl p-3">
                      <p className="text-xs text-on-surface-variant mb-1">{item.label}</p>
                      <p className={`text-xl font-bold ${item.warn ? 'text-error' : 'text-on-surface'}`}>
                        {item.value}<span className="text-sm font-normal">{item.unit}</span>
                      </p>
                      <div className="h-1.5 bg-surface-container-high rounded-full mt-2">
                        <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Performance Prediction (Next 7 Days)</p>
                <div className="bg-inverse-surface rounded-xl p-4">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Projected Intensity</p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-bold text-white">{displayedPlayer.projectedIntensity}</p>
                    <BarChart3 size={24} className="text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-base">
                      <span className="text-white/60">Aerobic Capacity</span>
                      <span className={`font-semibold ${displayedPlayer.aerobicCapacity === 'Optimal' ? 'text-secondary-fixed-dim' : displayedPlayer.aerobicCapacity === 'Good' ? 'text-primary-fixed-dim' : 'text-error'}`}>
                        {displayedPlayer.aerobicCapacity}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-white/60">Match Readiness</span>
                      <span className="font-semibold text-white">{displayedPlayer.matchReadiness}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#F97316]/30 border-l-4 border-l-[#F97316]" style={{ background: '#FEF3EA' }}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-[#F97316] text-white text-sm font-bold rounded-full flex items-center gap-1">
                      <Zap size={12} /> AI INSIGHT
                    </span>
                  </div>
                  <p className="text-lg font-bold text-on-surface mb-2">Tactical Optimization</p>
                  <p className="text-base text-on-surface-variant leading-relaxed mb-4">
                    {displayedPlayer.aiInsight.includes('Recommendation:') ? (
                      <>
                        {displayedPlayer.aiInsight.split('Recommendation:')[0]}
                        <strong className="text-primary">Recommendation:</strong>
                        {displayedPlayer.aiInsight.split('Recommendation:')[1]}
                      </>
                    ) : displayedPlayer.aiInsight}
                  </p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 border border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors bg-white">
                      Dismiss
                    </button>
                    <button className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-colors">
                      Apply to Schedule
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-outline-variant shrink-0">
              <button className="w-full py-3.5 border-2 border-primary rounded-xl text-base font-bold text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
                View Full Analytics Report
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}