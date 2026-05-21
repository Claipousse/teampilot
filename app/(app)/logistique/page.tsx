import { Zap, SlidersHorizontal, Mail, Pencil, Circle, Bus, MoreVertical } from 'lucide-react';

const alerts = [
  {
    icon: '📦',
    iconBg: 'bg-[#F97316]/10',
    border: 'border-l-4 border-[#F97316]',
    title: 'Low supply of training kits',
    desc: 'Size Medium kits are below the safety threshold of 5 units. Reorder recommended.',
    action: 'REORDER NOW',
    actionColor: 'text-[#F97316]',
  },
  {
    icon: '✈️',
    iconBg: 'bg-primary/10',
    border: 'border-l-4 border-primary',
    title: 'Away Match Logistics',
    desc: "Travel confirmation for next week's match in Lyon is pending coach approval.",
    action: 'CONFIRM TRAVEL',
    actionColor: 'text-primary',
  },
  {
    icon: '🛡️',
    iconBg: 'bg-secondary/10',
    border: 'border-l-4 border-secondary',
    title: 'Medical Inventory',
    desc: 'Recovery tape and hydration salts restock arriving today at 2:00 PM.',
    action: 'VIEW TRACKING',
    actionColor: 'text-secondary',
  },
];

const equipment = [
  {
    icon: '⚽',
    name: 'Pro Match Balls (Size 5)',
    category: 'Field Gear',
    qty: 42,
    total: 50,
    status: 'In stock',
    statusBg: 'bg-secondary/10',
    statusColor: 'text-secondary',
    barColor: 'bg-secondary',
  },
  {
    icon: '👕',
    name: 'Training Bibs (Neon)',
    category: 'Apparel',
    qty: 8,
    total: 40,
    status: 'Low stock',
    statusBg: 'bg-[#F97316]/10',
    statusColor: 'text-[#F97316]',
    barColor: 'bg-[#F97316]',
  },
  {
    icon: '🧰',
    name: 'Emergency Med Kits',
    category: 'Medical',
    qty: 2,
    total: 10,
    status: 'Needs reorder',
    statusBg: 'bg-error/10',
    statusColor: 'text-error',
    barColor: 'bg-error',
  },
];

const users = [
  { initials: 'MD', name: 'Marc Dupont', role: 'Entraîneur' },
  { initials: 'JM', name: 'Julian Mbappé', role: 'Joueur' },
  { initials: 'SB', name: 'Sarah Bernard', role: 'Médecin' },
  { initials: 'AS', name: 'Admin System', role: 'Admin' },
];

export default function LogistiquePage() {
  return (
    <div className="flex gap-5 h-full overflow-y-auto">

      {/* ── Contenu principal ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Logistics Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={22} className="text-[#F97316]" />
              <h2 className="text-2xl font-bold text-on-surface">Logistics Alerts</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Powered by TeamPilot AI</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {alerts.map((alert, i) => (
              <div key={i} className={`bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 ${alert.border}`}>
                <div className={`w-12 h-12 ${alert.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {alert.icon}
                </div>
                <p className="text-lg font-bold text-on-surface mb-2">{alert.title}</p>
                <p className="text-base text-on-surface-variant leading-relaxed mb-4">{alert.desc}</p>
                <button className={`text-base font-bold ${alert.actionColor} hover:underline`}>
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment & Material */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-on-surface mb-1">Equipment & Material</h2>
              <p className="text-base text-on-surface-variant">Real-time inventory levels across training facilities</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <SlidersHorizontal size={18} /> Filter
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-surface-container rounded-xl mb-2">
            {['Item Name', 'Category', 'Inventory', 'Status', 'Actions'].map((col, i) => (
              <p key={i} className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{col}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {equipment.map((item, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-4 rounded-xl hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-lg font-semibold text-on-surface">{item.name}</p>
                </div>
                <p className="text-base text-on-surface-variant">{item.category}</p>
                <div>
                  <p className="text-lg font-bold text-on-surface mb-1">
                    {item.qty} <span className="text-base font-normal text-on-surface-variant">/ {item.total}</span>
                  </p>
                  <div className="h-1.5 bg-surface-container rounded-full w-20">
                    <div
                      className={`h-1.5 rounded-full ${item.barColor}`}
                      style={{ width: `${(item.qty / item.total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`inline-block px-3 py-1.5 rounded-xl text-sm font-bold ${item.statusBg} ${item.statusColor}`}>
                  {item.status}
                </span>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <MoreVertical size={18} className="text-on-surface-variant" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant text-center">
            <button className="text-base font-bold text-primary hover:underline uppercase tracking-wider">
              View Full Inventory
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-5">

          {/* Facility Maintenance */}
          <div className="bg-inverse-surface rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Facility Maintenance</h3>
              <p className="text-base text-white/60 mb-5">Next pitch seeding scheduled: Nov 15th</p>
              <div className="flex items-center gap-2">
                <Circle size={12} className="text-secondary fill-secondary shrink-0" />
                <p className="text-base font-bold text-secondary uppercase tracking-wider">Pitch A: Optimal Condition</p>
              </div>
            </div>
            <div className="absolute right-6 bottom-6 opacity-10">
              <span className="text-9xl">🌿</span>
            </div>
          </div>

          {/* Logistics Fleet */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-on-surface mb-2">Logistics Fleet</h3>
              <p className="text-base text-on-surface-variant mb-5">Team Bus #1 Maintenance required in 450km</p>
              <button className="px-5 py-3 bg-inverse-surface hover:bg-on-surface text-white text-base font-bold rounded-xl transition-colors uppercase tracking-wider">
                Schedule Service
              </button>
            </div>
            <div className="absolute right-6 bottom-6 opacity-5">
              <Bus size={80} className="text-on-surface" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Panneau droit : Platform Users ── */}
      <div className="w-72 shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sticky top-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-on-surface">Platform Users</h3>
            <button className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-container transition-colors">
              <span className="text-white text-lg font-bold">+</span>
            </button>
          </div>

          <div className="space-y-3">
            {users.map((user, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-on-surface-variant">{user.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-on-surface truncate">{user.name}</p>
                  <p className="text-sm text-on-surface-variant">{user.role}</p>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                  <Pencil size={16} className="text-on-surface-variant" />
                </button>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 border-2 border-primary rounded-xl text-base font-bold text-primary hover:bg-primary hover:text-white transition-all">
            <Mail size={18} /> Invite New User
          </button>
        </div>
      </div>

    </div>
  );
}