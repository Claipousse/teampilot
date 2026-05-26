import {
  Clock, UserPlus, ShoppingCart, CalendarPlus,
  AlertTriangle, MessageSquare, Send, Users, Calendar, MapPin,
} from 'lucide-react';

const squadPlayers = [
  { initials: 'LM', name: 'Leo Maxwell', position: 'Forward', status: 'FIT', statusBg: 'bg-secondary/10', statusColor: 'text-secondary', return: '—' },
  { initials: 'DC', name: 'David Chen', position: 'Midfield', status: 'QUESTIONABLE', statusBg: 'bg-[#F97316]/10', statusColor: 'text-[#F97316]', return: '2 days' },
  { initials: 'SI', name: 'S. Ibrahim', position: 'Goalkeeper', status: 'INJURED', statusBg: 'bg-error/10', statusColor: 'text-error', return: '3 weeks' },
];

const stockAlerts = [
  { name: 'Emergency Med-Kits', qty: 2, label: 'CRITICAL', labelColor: 'text-error', border: 'border-error/20 bg-error/5' },
  { name: 'Training Bibs (Blue)', qty: 14, label: 'LOW', labelColor: 'text-[#F97316]', border: 'border-outline-variant' },
  { name: 'Soccer Balls (Match)', qty: 8, label: 'LOW', labelColor: 'text-[#F97316]', border: 'border-outline-variant' },
];

const messages = [
  { initials: 'CF', name: 'Coach Ferran', time: '10m ago', preview: 'Pitch 3 sprinklers are acting up...' },
  { initials: 'MC', name: 'Marcus (Captain)', time: '2h ago', preview: 'Confirmed the team dinner...' },
];

const quickActions = [
  { icon: UserPlus, label: 'Add New Player' },
  { icon: ShoppingCart, label: 'Order Equipment' },
  { icon: CalendarPlus, label: 'Schedule New Event' },
];

export default function DashboardDesktop() {
  return (
    <div className="flex gap-5 h-full">

      {/* Contenu principal */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Operations Dashboard</h1>
            <p className="text-base text-on-surface-variant mt-1">
              Real-time oversight of logistics, scheduling, and roster availability.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl shrink-0">
            <Calendar size={18} className="text-on-surface-variant" />
            <span className="text-base font-semibold text-on-surface">Sept 24, 2024</span>
          </div>
        </div>

        {/* Quick Calendar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Clock size={22} className="text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Quick Calendar</h2>
            </div>
            <button className="text-base font-semibold text-primary hover:underline">View Full Calendar</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-5 p-5 border-l-4 border-primary bg-primary/5 rounded-xl">
              <div className="shrink-0 text-center">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Today</p>
                <p className="text-3xl font-extrabold text-on-surface leading-tight">10:00</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-on-surface">First Team Tactical Drill</p>
                <div className="flex items-center gap-1 text-base text-on-surface-variant mt-1">
                  <MapPin size={14} /> Pitch 3 · Lead: Coach Ferran
                </div>
              </div>
              <span className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-full shrink-0">TRAINING</span>
            </div>
            <div className="flex items-center gap-5 p-5 border-l-4 border-secondary bg-secondary/5 rounded-xl">
              <div className="shrink-0 text-center">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Tomorrow</p>
                <p className="text-3xl font-extrabold text-on-surface leading-tight">15:00</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-on-surface">TeamPilot AI vs. North Star Utd</p>
                <div className="flex items-center gap-1 text-base text-on-surface-variant mt-1">
                  <Calendar size={14} /> Home Stadium · Season Week 12
                </div>
              </div>
              <span className="px-4 py-2 bg-secondary/10 text-secondary text-sm font-bold rounded-full shrink-0">MATCHDAY</span>
            </div>
          </div>
        </div>

        {/* Squad Availability */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Users size={22} className="text-on-surface-variant" />
              <h2 className="text-xl font-bold text-on-surface">Squad Availability</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-base font-semibold text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> 22 Fit
              </span>
              <span className="flex items-center gap-2 text-base font-semibold text-error">
                <span className="w-2.5 h-2.5 rounded-full bg-error" /> 3 Injured
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 px-4 py-3 border-b border-outline-variant mb-2">
            {['Player', 'Position', 'Status', 'Est. Return'].map((col, i) => (
              <p key={i} className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{col}</p>
            ))}
          </div>
          <div className="space-y-1">
            {squadPlayers.map((player, i) => (
              <div key={i} className="grid grid-cols-4 items-center px-4 py-4 rounded-xl hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-on-surface-variant">{player.initials}</span>
                  </div>
                  <p className="text-lg font-semibold text-on-surface">{player.name}</p>
                </div>
                <p className="text-base text-on-surface-variant">{player.position}</p>
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold w-fit ${player.statusBg} ${player.statusColor}`}>
                  {player.status}
                </span>
                <p className="text-base text-on-surface-variant">{player.return}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="w-80 shrink-0 flex flex-col gap-5 overflow-y-auto">

        {/* Quick Actions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <h3 className="text-lg font-bold text-on-surface mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button key={i} className="w-full flex items-center gap-4 p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors text-left">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <p className="text-base font-semibold text-on-surface">{action.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-error" />
            <h3 className="text-lg font-bold text-on-surface">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {stockAlerts.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-4 border rounded-xl ${item.border}`}>
                <div>
                  <p className="text-base font-semibold text-on-surface">{item.name}</p>
                  <p className="text-sm text-on-surface-variant">Qty: {item.qty} remaining</p>
                </div>
                <span className={`text-sm font-extrabold ${item.labelColor}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-base font-bold text-primary hover:underline text-center">
            Manage Inventory
          </button>
        </div>

        {/* Recent Messages */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-on-surface-variant" />
            <h3 className="text-lg font-bold text-on-surface">Recent Messages</h3>
          </div>
          <div className="space-y-3 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-on-surface-variant">{msg.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-base font-bold text-on-surface">{msg.name}</p>
                    <span className="text-xs text-on-surface-variant shrink-0 ml-2">{msg.time}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant truncate">{msg.preview}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl">
            <input
              type="text"
              placeholder="Quick reply..."
              className="flex-1 bg-transparent text-base text-on-surface placeholder:text-outline outline-none"
            />
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
              <Send size={16} className="text-primary" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}