import {
  MapPin, Calendar, AlertTriangle, Plus, ChevronRight,
} from 'lucide-react';

const events = [
  {
    time: '10:00 - 12:00',
    title: 'Entraînement tactique',
    location: 'Terrain 1',
    icon: MapPin,
  },
  {
    time: '20:30 - 22:30',
    title: 'Match contre North Star Utd',
    location: 'Stade Municipal',
    icon: Calendar,
  },
];

const players = [
  { initials: 'LM', name: 'Lucas Martin', position: 'Défenseur Central', status: 'FIT', statusBg: 'bg-secondary/10', statusColor: 'text-secondary' },
  { initials: 'TD', name: 'Thomas Dubois', position: 'Milieu de terrain', status: 'QUESTIONABLE', statusBg: 'bg-[#F97316]/10', statusColor: 'text-[#F97316]' },
  { initials: 'HL', name: 'Hugo Leroy', position: 'Gardien de but', status: 'INJURED', statusBg: 'bg-error/10', statusColor: 'text-error' },
];

const messages = [
  {
    initials: 'JD',
    name: 'Jean Dupont',
    role: 'Kiné',
    time: '14:02',
    preview: "L'IRM de Hugo Leroy confirme une lésion grade 2. Indisponibilité estimée à 3...",
    bg: 'bg-surface-container-high',
  },
  {
    initials: 'ML',
    name: 'Marc Laurent',
    role: 'Logistique',
    time: '11:45',
    preview: 'Les chasubles de rechange sont arrivées au centre de formation. Je les amène...',
    bg: 'bg-secondary',
  },
];

export default function DashboardMobile() {
  return (
    <div className="space-y-8">

      {/* Aujourd'hui */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-on-surface">Aujourd'hui</h2>
          <span className="text-base text-on-surface-variant">24 Octobre</span>
        </div>
        <div className="space-y-3">
          {events.map((event, i) => {
            const Icon = event.icon;
            return (
              <div
                key={i}
                className="flex items-stretch bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden"
              >
                <div className="w-1 bg-primary shrink-0" />
                <div className="flex-1 px-4 py-4">
                  <p className="text-sm font-bold text-primary mb-1">{event.time}</p>
                  <p className="text-xl font-bold text-on-surface mb-1">{event.title}</p>
                  <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <Icon size={13} /> {event.location}
                  </div>
                </div>
                <div className="flex items-center pr-4">
                  <ChevronRight size={20} className="text-on-surface-variant" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disponibilité */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-on-surface">Disponibilité</h2>
          <button className="text-sm font-bold text-primary uppercase tracking-wider">
            Voir tout
          </button>
        </div>
        <div className="space-y-3">
          {players.map((player, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-on-surface-variant">{player.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-on-surface">{player.name}</p>
                <p className="text-sm text-on-surface-variant">{player.position}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${player.statusBg} ${player.statusColor}`}>
                {player.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Staff - Messages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-on-surface">Staff - Messages</h2>
          <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </button>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl divide-y divide-outline-variant">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className={`w-12 h-12 rounded-full ${msg.bg} flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold text-on-surface-variant">{msg.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-bold text-on-surface">
                    {msg.name}{' '}
                    <span className="text-on-surface-variant font-normal">· {msg.role}</span>
                  </p>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-2">{msg.time}</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{msg.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}