import Image from 'next/image';
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Video,
  Plus,
  Users,
  Share2,
  BellRing,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-5">

      {/* Alerte fatigue */}
      <div className="flex items-center justify-between px-5 py-4 bg-error-container border border-error/20 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-error shrink-0" />
          <p className="text-base font-semibold text-on-error-container">
            High fatigue risk detected for 3 players
          </p>
        </div>
        <button className="text-base font-semibold text-error hover:underline shrink-0">
          View Players
        </button>
      </div>

      {/* Ligne 1 — 3 stat cards */}
      <div className="grid grid-cols-3 gap-5">

        {/* Team Readiness */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
              Team Readiness
            </p>
            <span className="flex items-center gap-1 px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full">
              <Zap size={11} /> AI Optimized
            </span>
          </div>
          <div className="flex items-end gap-4">
            <p className="text-7xl font-extrabold text-primary tracking-tight leading-none">
              94<span className="text-4xl">%</span>
            </p>
            <div className="flex items-center gap-1 mb-1 text-secondary text-base font-bold">
              <TrendingUp size={18} />
              2.4%
            </div>
          </div>
        </div>

        {/* Next Match Countdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-5">
            Next Match Countdown
          </p>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-6xl font-extrabold text-on-surface tracking-tight leading-none">18</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Hours</p>
            </div>
            <p className="text-4xl font-bold text-on-surface-variant pb-4">:</p>
            <div className="text-center">
              <p className="text-6xl font-extrabold text-on-surface tracking-tight leading-none">42</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Mins</p>
            </div>
            <div className="ml-3 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg">
                ⚽
              </div>
              <p className="text-lg font-bold text-on-surface">vs. Barcelona</p>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-5">
            Recent Form
          </p>
          <div className="flex items-center gap-3">
            {[
              { r: 'W', bg: 'bg-secondary', text: 'text-white' },
              { r: 'W', bg: 'bg-secondary', text: 'text-white' },
              { r: 'D', bg: 'bg-surface-container-high', text: 'text-on-surface' },
              { r: 'W', bg: 'bg-secondary', text: 'text-white' },
              { r: 'L', bg: 'bg-error', text: 'text-white' },
            ].map((item, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${item.bg} ${item.text}`}
              >
                {item.r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ligne 2 — AI Insights + Heatmap + Upcoming */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-5">

        {/* AI Insights */}
        <div
          className="rounded-2xl overflow-hidden border border-[#F97316]/30 border-l-4 border-l-[#F97316]"
          style={{ background: '#FEF3EA', boxShadow: '0 0 24px rgba(249,115,22,0.12)' }}
        >
          <div className="flex items-center gap-2 px-6 pt-6 pb-4">
            <span className="text-[#C2410C] text-lg">🤖</span>
            <p className="text-sm font-bold text-[#C2410C] uppercase tracking-widest">
              AI Insights
            </p>
          </div>

          <div className="px-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-0.5 bg-[#F97316] shrink-0 rounded-full" />
              <div>
                <p className="text-sm font-bold text-[#F97316] mb-1">
                  Recommended training load
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Reduce intensity by <strong className="text-on-surface">15%</strong> for the Midfield unit to avoid hamstring strains.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-0.5 bg-[#F97316] shrink-0 rounded-full" />
              <div>
                <p className="text-sm font-bold text-[#F97316] mb-1">
                  Optimal lineup suggestion
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Deploy <strong className="text-on-surface">High Press 4-3-3</strong> against upcoming opponent's low block.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <button className="w-full py-3 bg-white border border-[#F97316]/30 rounded-xl text-sm font-semibold text-on-surface hover:bg-[#FFF0E6] transition-colors">
              Apply Strategy
            </button>
          </div>
        </div>

        {/* Squad Health & Tactical Density */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xl font-bold text-on-surface">
              Squad Health & Tactical Density
            </p>
            <div className="flex items-center gap-4 text-sm text-on-surface-variant shrink-0 mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                Optimal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
                Injury Risk
              </span>
            </div>
          </div>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <Image
              src="/heatmap.png"
              alt="Squad heatmap"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
              Upcoming
            </p>
            <Calendar size={18} className="text-on-surface-variant" />
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border-l-4 border-primary bg-surface-container-low">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Training</span>
                <span className="text-xs text-on-surface-variant">10:00 AM</span>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-1">High-Intensity Pressing</p>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <MapPin size={12} /> Pitch 3, Training Grounds
              </div>
            </div>
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Match Day</span>
                <span className="text-xs text-on-surface-variant">Tomorrow</span>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-1">vs. Real Madrid CF</p>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Calendar size={12} /> Santiago Bernabéu
              </div>
            </div>
            <div className="p-4 rounded-xl border-l-4 border-secondary bg-surface-container-low">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Tactics</span>
                <span className="text-xs text-on-surface-variant">Mon 2:00 PM</span>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-1">Set Piece Analysis</p>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Video size={12} /> Video Room A
              </div>
            </div>
          </div>
          <button className="mt-4 w-full text-sm font-semibold text-primary hover:underline text-center">
            View Full Calendar
          </button>
        </div>
      </div>

      {/* Ligne 3 — 4 cards */}
      <div className="grid grid-cols-4 gap-5">

        {/* Team Spirit Index */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-5">
            Team Spirit Index
          </p>
          <div className="w-full h-2.5 bg-surface-container rounded-full mb-4">
            <div className="h-2.5 bg-secondary rounded-full" style={{ width: '82%' }} />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface text-base">82%</strong> High Engagement detected in locker room comms.
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-5">
            Performance Metrics
          </p>
          <div className="space-y-3 mb-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">Pressing</span>
                <span className="font-semibold text-on-surface">87%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: '87%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">Passing</span>
                <span className="font-semibold text-on-surface">79%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: '79%' }} />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-3 border-t border-outline-variant">
            <div className="text-center">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Attack</p>
              <p className="text-2xl font-bold text-primary">8.4</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Defense</p>
              <p className="text-2xl font-bold text-on-surface">7.2</p>
            </div>
          </div>
        </div>

        {/* Possession Flow */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-5">
            Possession Flow
          </p>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-on-surface font-medium">Transition</span>
                <span className="text-sm font-bold text-secondary">+12%</span>
              </div>
              <div className="h-2.5 bg-surface-container rounded-full">
                <div className="h-2.5 bg-primary rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-on-surface font-medium">Control</span>
                <span className="text-sm text-on-surface-variant">Neutral</span>
              </div>
              <div className="h-2.5 bg-surface-container rounded-full">
                <div className="h-2.5 bg-outline-variant rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Control Center */}
        <div className="bg-inverse-surface rounded-2xl p-6">
          <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-5">
            Control Center
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Log', icon: Plus },
              { label: 'Lineup', icon: Users },
              { label: 'Alert Team', icon: BellRing },
              { label: 'Export', icon: Share2 },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex flex-col items-center justify-center gap-2 py-5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <Icon size={22} className="text-white" />
                  <span className="text-xs text-white/70 font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}