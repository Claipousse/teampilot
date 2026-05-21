'use client';

import { useState } from 'react';
import { Send, Zap, AlertTriangle, CheckCircle, TrendingUp, Shield, Target, Activity, ChevronRight } from 'lucide-react';

const players = [
  { name: 'Bukayo Saka', initials: 'BS', load: 'CRITICAL', loadColor: 'text-error', barColor: 'bg-error', barWidth: '95%' },
  { name: 'Declan Rice', initials: 'DR', load: 'HIGH', loadColor: 'text-[#F97316]', barColor: 'bg-[#F97316]', barWidth: '75%' },
  { name: 'M. Odegaard', initials: 'MO', load: 'OPTIMAL', loadColor: 'text-secondary', barColor: 'bg-secondary', barWidth: '55%' },
  { name: 'William Saliba', initials: 'WS', load: 'FRESH', loadColor: 'text-primary', barColor: 'bg-primary', barWidth: '30%' },
];

const formation = [
  { row: 15, positions: [{ x: 20, label: 'LW', name: 'MARTINELLI' }, { x: 50, label: 'ST', name: 'JESUS' }, { x: 80, label: 'RW', name: 'SAKA' }] },
  { row: 38, positions: [{ x: 33, label: 'CM', name: 'RICE' }, { x: 67, label: 'CM', name: 'ODEGAARD' }] },
  { row: 62, positions: [{ x: 12, label: 'LB', name: 'ZINCHENKO' }, { x: 37, label: 'CB', name: 'GABRIEL' }, { x: 63, label: 'CB', name: 'SALIBA' }, { x: 88, label: 'RB', name: 'WHITE' }] },
];

const insights = [
  {
    icon: AlertTriangle,
    iconColor: 'text-error',
    title: 'Exploit Wide Weakness',
    text: 'Opponent (Brighton) has conceded 64% of goals from wide crosses. Switch to ',
    highlight: '4-3-3 Wide',
    textEnd: ' to isolate their fullbacks.',
  },
  {
    icon: CheckCircle,
    iconColor: 'text-secondary',
    title: 'Squad Rotation Required',
    text: "Saka's fatigue index is at 88. AI recommends starting Trossard to reduce injury risk by ",
    highlight: '12%',
    textEnd: '.',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-primary',
    title: 'Set Piece Analysis',
    text: 'In-swinging corners to the near post have a ',
    highlight: '4.2x higher xG',
    textEnd: ' against the current opponent profile.',
  },
];

const statCards = [
  { icon: Shield, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', label: 'Injury Reduction', value: '84%', valueColor: 'text-secondary' },
  { icon: Target, iconBg: 'bg-primary/10', iconColor: 'text-primary', label: 'Tactical Efficiency', value: '92.4', valueColor: 'text-primary' },
  { icon: Activity, iconBg: 'bg-[#F97316]/10', iconColor: 'text-[#F97316]', label: 'Win Probability', value: '68.2%', valueColor: 'text-[#F97316]' },
  { icon: Zap, iconBg: 'bg-surface-container-high', iconColor: 'text-on-surface-variant', label: 'Avg. Velocity', value: '32.4', valueColor: 'text-on-surface', unit: 'km/h' },
];

const bottomStats = [
  { label: 'Last Match xG', value: '2.84', sub: '↗ +12% vs Season Avg', subColor: 'text-secondary' },
  { label: 'PPDA Index', value: '8.2', sub: 'Aggressive High Press', subColor: 'text-on-surface-variant' },
  { label: 'Deep Completions', value: '14', sub: '! 2nd in League', subColor: 'text-[#F97316]' },
  { label: 'Verticality Score', value: '74%', sub: 'Optimized for Counter', subColor: 'text-secondary' },
];

export default function IAAnalyticsPage() {
  const [chatInput, setChatInput] = useState('');

  return (
    <div className="flex gap-5 h-full min-h-0">

      {/* ── Contenu principal ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">AI Tactical Lab</h1>
            <p className="text-base text-on-surface-variant mt-1">
              Live predictive modeling and squad optimization for Gameweek 24.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Activity size={18} /> Compare Models
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-colors">
              <Zap size={18} /> Run Simulation
            </button>
          </div>
        </div>

        {/* 4 stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={22} className={card.iconColor} />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1">{card.label}</p>
                  <p className={`text-2xl font-extrabold ${card.valueColor} leading-none`}>
                    {card.value}
                    {card.unit && <span className="text-base font-semibold ml-1">{card.unit}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Terrain tactique */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Target size={22} className="text-primary" />
              <p className="text-xl font-bold text-on-surface">Tactical Composition Suggester</p>
            </div>
            <span className="px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-full tracking-wide">
              OPTIMIZED: 4-3-3 ATTACK
            </span>
          </div>

          {/* Terrain */}
          <div className="relative w-full rounded-xl overflow-hidden" style={{ background: '#2d5a1b', paddingBottom: '52%' }}>
            {/* Lignes du terrain */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 52" preserveAspectRatio="none">
              {/* Contour */}
              <rect x="2" y="2" width="96" height="48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              {/* Ligne médiane */}
              <line x1="50" y1="2" x2="50" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              {/* Cercle central */}
              <circle cx="50" cy="26" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <circle cx="50" cy="26" r="0.5" fill="rgba(255,255,255,0.5)" />
              {/* Surface gauche */}
              <rect x="2" y="15" width="14" height="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="2" y="20" width="6" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              {/* Surface droite */}
              <rect x="84" y="15" width="14" height="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="92" y="20" width="6" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>

            {/* Joueurs */}
            {formation.map((row, ri) =>
              row.positions.map((pos, pi) => (
                <div
                  key={`${ri}-${pi}`}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${pos.x}%`, top: `${row.row}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs font-bold">{pos.label}</span>
                  </div>
                  <span className="text-white text-xs font-bold mt-1 tracking-wider drop-shadow">{pos.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Predictive Form + Squad Physical Load */}
        <div className="grid grid-cols-2 gap-5">

          {/* Predictive Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xl font-bold text-on-surface">Predictive Form</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-3 h-0.5 bg-primary inline-block rounded" /> PROJECTED
                </span>
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-3 h-0.5 bg-outline inline-block rounded" /> ACTUAL
                </span>
              </div>
            </div>
            <div className="relative h-36 mt-4">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* Grid lines */}
                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                ))}
                {/* Actual line */}
                <polyline
                  points="0,100 50,95 100,85 150,80 200,72 250,68"
                  fill="none" stroke="#747686" strokeWidth="1.5" strokeDasharray="4,3"
                />
                {/* Projected line */}
                <polyline
                  points="200,72 220,60 250,45 280,30"
                  fill="none" stroke="#0037b0" strokeWidth="2"
                />
                {/* Peak label */}
                <text x="240" y="28" fill="#0037b0" fontSize="8" fontWeight="bold">Peak Performance</text>
              </svg>
              <div className="flex justify-between mt-1">
                {['GW 20', 'GW 21', 'GW 22', 'GW 23', 'GW 24', 'GW 25'].map(gw => (
                  <span key={gw} className="text-xs text-on-surface-variant">{gw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Squad Physical Load */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Zap size={22} className="text-error" />
              <p className="text-xl font-bold text-on-surface">Squad Physical Load</p>
            </div>
            <div className="space-y-4">
              {players.map((player, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-on-surface-variant">{player.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-base font-semibold text-on-surface">{player.name}</p>
                      <span className={`text-base font-bold ${player.loadColor}`}>{player.load}</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full">
                      <div className={`h-2 rounded-full ${player.barColor}`} style={{ width: player.barWidth }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Elite Performance Lab */}
        <div className="bg-inverse-surface rounded-2xl p-6">
          <div className="flex gap-8">
            <div className="w-72 shrink-0">
              <p className="text-2xl font-bold text-white mb-3">Elite Performance Lab</p>
              <p className="text-base text-white/60 leading-relaxed mb-5">
                Our neural network has processed over 40,000 matches to provide these real-time tactical adjustments. Every decision is backed by mathematical certainty.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['A', 'B', 'C'].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary border-2 border-inverse-surface flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/60 font-semibold">Verified by Performance Team</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-5 flex-1">
              {bottomStats.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/50 mb-2">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-white mb-1">{stat.value}</p>
                  <p className={`text-sm font-semibold ${stat.subColor}`}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Panneau droit : AI Insights + Chat ── */}
      <div className="w-140 shrink-0 flex flex-col gap-5">

        {/* AI Insights */}
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface">AI Insights</p>
              <p className="text-sm text-on-surface-variant">Real-time tactical advisory</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Icon size={18} className={`${insight.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-base font-bold text-on-surface mb-1">{insight.title}</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {insight.text}
                        <strong className="text-primary">{insight.highlight}</strong>
                        {insight.textEnd}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-outline shrink-0 mt-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat */}
          <div className="mt-5 pt-5 border-t border-outline-variant">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Ask AI anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              <button className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 hover:bg-primary-container transition-colors">
                <Send size={16} className="text-white" />
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-outline-variant rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                SUBSTITUTION PLANS
              </button>
              <button className="px-3 py-1.5 border border-outline-variant rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                PRESSING MAPS
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}