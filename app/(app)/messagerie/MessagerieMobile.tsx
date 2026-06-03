'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ArrowLeft, Send, Download, FileText, Users, X } from 'lucide-react';

type RoleType = 'player' | 'coach' | 'staff' | 'ai';
type Tab = 'Tous' | 'Team' | 'Staff';
type Member = { name: string; initials: string; bg: string; role: string; roleType: RoleType };
type Message = {
  id: number; type: 'received' | 'sent' | 'file' | 'system';
  text?: string; time?: string;
  senderName?: string; senderInitials?: string; senderBg?: string; senderRoleType?: RoleType;
};
type Conversation = {
  id: number; name: string; time: string; preview: string;
  initials: string; avatarBg: string; category: 'team' | 'staff';
  roleType: RoleType | 'group'; isAI?: boolean; isGroup?: boolean;
  role?: string; members?: Member[]; unread?: boolean; messages: Message[];
};

function nameColor(roleType?: string): string {
  switch (roleType) {
    case 'ai':
    case 'player': return 'text-primary';
    case 'coach':  return 'text-[#B45309]';
    case 'staff':  return 'text-secondary';
    default:       return 'text-on-surface';
  }
}

function roleAccent(roleType?: string): { border: string; dot: string; bg: string } {
  switch (roleType) {
    case 'ai':
    case 'player': return { border: 'border-primary',   dot: 'bg-primary',   bg: 'bg-primary/5' };
    case 'coach':  return { border: 'border-[#B45309]', dot: 'bg-[#B45309]', bg: 'bg-[#B45309]/5' };
    case 'staff':  return { border: 'border-secondary', dot: 'bg-secondary', bg: 'bg-secondary/5' };
    default:       return { border: 'border-primary',   dot: 'bg-primary',   bg: 'bg-primary/5' };
  }
}

const ALL_CONVERSATIONS: Conversation[] = [
  {
    id: 1, name: 'Tactical AI', category: 'staff', roleType: 'ai', isAI: true,
    time: '', preview: 'Planning de la semaine prochaine disponible.',
    initials: '✦', avatarBg: 'bg-primary', unread: true,
    messages: [
      { id: 1, type: 'received', text: 'Bonjour Coach. Le planning de la semaine prochaine est disponible. Entraînement intensif lundi, récupération mercredi avant le match de samedi.', time: '8:00' },
      { id: 2, type: 'sent',     text: 'Merci. Prépare-moi un résumé des statistiques de la semaine passée.', time: '8:05' },
      { id: 3, type: 'received', text: '3 entraînements effectués, 94% de présence, distance moyenne : 9.2 km par joueur.', time: '8:06' },
      { id: 4, type: 'sent',     text: 'Parfait. Prépare aussi un point sur les absences.', time: '8:10' },
      { id: 5, type: 'received', text: 'Julian R. absent 2 séances (blessure). Alex M. absent 1 séance (suspension préventive).', time: '8:11' },
    ],
  },
  {
    id: 2, name: 'Coach Marcus', category: 'staff', roleType: 'coach',
    time: '10:45', preview: 'On reprend à 14h sur le terrain 2.',
    initials: 'CM', avatarBg: 'bg-surface-container-high', role: 'Head Coach', unread: true,
    messages: [
      { id: 1, type: 'received', text: "Séance du matin annulée — conditions météo. On reprend à 14h sur le terrain 2 couvert.", time: '9:30' },
      { id: 2, type: 'sent',     text: "Reçu. Je préviens les joueurs.", time: '9:35' },
      { id: 3, type: 'received', text: "Séance vidéo à 13h pour analyser le dernier match.", time: '9:36' },
      { id: 4, type: 'sent',     text: "Salle de projection disponible à 13h.", time: '9:40' },
      { id: 5, type: 'received', text: "On reprend à 14h sur le terrain 2.", time: '10:45' },
    ],
  },
  {
    id: 3, name: 'Sarah Bernard', category: 'staff', roleType: 'staff',
    time: '9:12', preview: 'Bilan médical de Julian R. après scanner.',
    initials: 'SB', avatarBg: 'bg-surface-container-high', role: 'Médecin',
    messages: [
      { id: 1, type: 'received', text: "Lésion de grade 2 aux ischio-jambiers pour Julian R. Repos complet 3 semaines minimum.", time: '8:45' },
      { id: 2, type: 'sent',     text: "Forfait pour les 2 prochains matchs donc ?", time: '8:50' },
      { id: 3, type: 'received', text: "Oui minimum. On réévalue dans 10 jours. Rapport ci-joint.", time: '8:52' },
      { id: 4, type: 'file',     time: '8:53' },
      { id: 5, type: 'sent',     text: "Bien reçu. Tenez-moi informé.", time: '9:12' },
    ],
  },
  {
    id: 4, name: 'Staff Tactique', category: 'staff', roleType: 'group', isGroup: true,
    time: 'Hier', preview: 'Coach Marcus: Réunion demain 9h.',
    initials: 'ST', avatarBg: 'bg-inverse-surface',
    members: [
      { name: 'Coach Marcus',  initials: 'CM', bg: 'bg-surface-container-high', role: 'Head Coach', roleType: 'coach' },
      { name: 'Sarah Bernard', initials: 'SB', bg: 'bg-surface-container-high', role: 'Médecin',    roleType: 'staff' },
      { name: 'Marc Laurent',  initials: 'ML', bg: 'bg-surface-container-high', role: 'Logistique', roleType: 'staff' },
      { name: 'Jean Dupont',   initials: 'JD', bg: 'bg-surface-container-high', role: 'Kiné',       roleType: 'staff' },
    ],
    messages: [
      { id: 1, type: 'system',   text: 'Groupe créé par Coach Marcus · 4 membres' },
      { id: 2, type: 'received', senderName: 'Coach Marcus',  senderInitials: 'CM', senderBg: 'bg-surface-container-high', senderRoleType: 'coach', text: "Réunion demain 9h. Point sur les blessés et préparation match samedi.", time: '18:00' },
      { id: 3, type: 'received', senderName: 'Sarah Bernard', senderInitials: 'SB', senderBg: 'bg-surface-container-high', senderRoleType: 'staff', text: "Présente. Je prépare un point sur Julian R. et Tom O.", time: '18:15' },
      { id: 4, type: 'sent',     text: "Parfait. Salle de réunion A.", time: '18:35' },
      { id: 5, type: 'received', senderName: 'Coach Marcus', senderInitials: 'CM', senderBg: 'bg-surface-container-high', senderRoleType: 'coach', text: "Réunion demain 9h. À demain.", time: '19:00' },
    ],
  },
  {
    id: 5, name: 'Marcus V.', category: 'team', roleType: 'player',
    time: '11:20', preview: 'Présent à 8h30 demain Coach.',
    initials: 'MV', avatarBg: 'bg-surface-container-high', role: 'Milieu Central · #8', unread: true,
    messages: [
      { id: 1, type: 'sent',     text: "Marcus, peux-tu venir 30 minutes plus tôt demain pour un travail sur les transitions ?", time: '10:45' },
      { id: 2, type: 'received', text: "Bien sûr Coach. À quelle heure ?", time: '10:50' },
      { id: 3, type: 'sent',     text: "8h30, avant la séance collective.", time: '10:52' },
      { id: 4, type: 'received', text: "Présent à 8h30 demain Coach.", time: '11:20' },
    ],
  },
  {
    id: 6, name: 'Kevin L.', category: 'team', roleType: 'player',
    time: '9:30', preview: "D'accord, je ferai attention.",
    initials: 'KL', avatarBg: 'bg-surface-container-high', role: 'Attaquant Centre · #9',
    messages: [
      { id: 1, type: 'sent',     text: "Kevin, excellente semaine d'entraînement. Continue pour samedi.", time: '9:00' },
      { id: 2, type: 'received', text: "Merci Coach ! Hâte d'être au match.", time: '9:10' },
      { id: 3, type: 'sent',     text: "Bien récupérer jeudi et vendredi. Pas de surcharge.", time: '9:25' },
      { id: 4, type: 'received', text: "D'accord, je ferai attention.", time: '9:30' },
    ],
  },
  {
    id: 7, name: 'Équipe Première', category: 'team', roleType: 'group', isGroup: true,
    time: 'Hier', preview: 'Coach: Rendez-vous samedi 13h au stade.',
    initials: 'EP', avatarBg: 'bg-primary',
    members: [
      { name: 'Marcus V.', initials: 'MV', bg: 'bg-surface-container-high', role: 'Milieu Central',    roleType: 'player' },
      { name: 'Kevin L.',  initials: 'KL', bg: 'bg-surface-container-high', role: 'Attaquant Centre',  roleType: 'player' },
      { name: 'Stefan K.', initials: 'SK', bg: 'bg-surface-container-high', role: 'Gardien de but',    roleType: 'player' },
      { name: 'Alex M.',   initials: 'AM', bg: 'bg-surface-container-high', role: 'Défenseur Central', roleType: 'player' },
      { name: 'Tom O.',    initials: 'TO', bg: 'bg-surface-container-high', role: 'Ailier Droit',      roleType: 'player' },
    ],
    messages: [
      { id: 1, type: 'system',   text: 'Groupe Équipe Première · 18 membres' },
      { id: 2, type: 'sent',     text: "Rendez-vous samedi 13h au stade. Bus départ 12h30 depuis le centre.", time: '17:00' },
      { id: 3, type: 'received', senderName: 'Marcus V.', senderInitials: 'MV', senderBg: 'bg-surface-container-high', senderRoleType: 'player', text: "Reçu Coach.", time: '17:05' },
      { id: 4, type: 'received', senderName: 'Stefan K.', senderInitials: 'SK', senderBg: 'bg-surface-container-high', senderRoleType: 'player', text: "Présent. Peut-on amener nos familles ?", time: '17:10' },
      { id: 5, type: 'sent',     text: "2 places par joueur au guichet. Parlez à Marc pour les billets.", time: '17:15' },
    ],
  },
  {
    id: 8, name: 'Stefan K.', category: 'team', roleType: 'player',
    time: 'Hier', preview: "Merci pour le retour, je travaille dessus.",
    initials: 'SK', avatarBg: 'bg-surface-container-high', role: 'Gardien de but · #1',
    messages: [
      { id: 1, type: 'sent',     text: "Stefan, bon match la semaine dernière. Point à travailler : tes sorties sur les centres.", time: '14:00' },
      { id: 2, type: 'received', text: "Oui j'ai revu les images. Je dois être plus décisif sur les ballons aériens.", time: '14:15' },
      { id: 3, type: 'sent',     text: "On travaille ça vendredi avec Jean en séance gardiens.", time: '14:20' },
      { id: 4, type: 'received', text: "Merci pour le retour, je travaille dessus.", time: '14:25' },
    ],
  },
];

export default function MessagerieMobile() {
  const [activeConv, setActiveConv]           = useState<Conversation | null>(null);
  const [input, setInput]                     = useState('');
  const [search, setSearch]                   = useState('');
  const [activeTab, setActiveTab]             = useState<Tab>('Tous');
  const [showMembers, setShowMembers]         = useState(false);
  const [membersVisible, setMembersVisible]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiConv     = ALL_CONVERSATIONS.find(c => c.isAI)!;
  const otherConvs = ALL_CONVERSATIONS.filter(c => !c.isAI);

  const filtered = useMemo(() => otherConvs.filter(conv => {
    const matchTab    = activeTab === 'Tous' || conv.category === activeTab.toLowerCase();
    const matchSearch = search === '' ||
      conv.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.preview.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [activeTab, search]);

  useEffect(() => {
    if (activeConv) messagesEndRef.current?.scrollIntoView();
  }, [activeConv?.id]);

  const openConv = (conv: Conversation) => {
    setActiveConv(conv);
    setShowMembers(false);
    setMembersVisible(false);
  };

  const openMembers  = () => { setShowMembers(true); setTimeout(() => setMembersVisible(true), 10); };
  const closeMembers = () => { setMembersVisible(false); setTimeout(() => setShowMembers(false), 300); };

  /* ── Vue conversation ── */
  if (activeConv) {
    return (
      <>
        <div className="fixed inset-x-0 bottom-0 z-30 bg-surface flex flex-col" style={{ top: '56px' }}>

          {/* Header — fixe */}
          <div className="shrink-0 bg-surface border-b border-outline-variant px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveConv(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors shrink-0">
                <ArrowLeft size={22} className="text-on-surface-variant" />
              </button>
              {activeConv.isGroup ? (
                <div className="w-10 h-10 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
                  <Users size={18} className="text-white/80" />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full ${activeConv.avatarBg} flex items-center justify-center shrink-0`}>
                  <span className={`font-bold text-sm ${activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>{activeConv.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-lg font-bold truncate ${nameColor(activeConv.isAI ? 'ai' : activeConv.roleType as string)}`}>{activeConv.name}</p>
                {activeConv.role && !activeConv.isGroup && (
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">{activeConv.role}</p>
                )}
                {activeConv.isGroup && activeConv.members && (
                  <p className="text-xs text-on-surface-variant truncate">{activeConv.members.map(m => m.name).join(', ')}</p>
                )}
                {activeConv.isAI && (
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">AI Assistant</p>
                )}
              </div>
              {activeConv.isGroup && (
                <button onClick={openMembers}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${showMembers ? 'bg-primary' : 'bg-surface-container'}`}>
                  <Users size={18} className={showMembers ? 'text-white' : 'text-on-surface-variant'} />
                </button>
              )}
            </div>
          </div>

          {/* Messages — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col justify-end min-h-full gap-3 px-4 py-4">
              <div className="flex justify-center">
                <div className="px-4 py-1.5 bg-surface-container rounded-full text-xs font-semibold text-on-surface-variant">Aujourd'hui</div>
              </div>

              {activeConv.messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'system' && (
                    <div className="flex justify-center">
                      <div className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant">{msg.text}</div>
                    </div>
                  )}
                  {msg.type === 'received' && (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className={`w-8 h-8 rounded-full ${msg.senderBg || activeConv.avatarBg} flex items-center justify-center shrink-0`}>
                        <span className={`font-bold text-xs ${activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                          {msg.senderInitials || activeConv.initials}
                        </span>
                      </div>
                      <div>
                        {activeConv.isGroup && msg.senderName && (
                          <p className={`text-xs font-bold mb-1 ml-1 ${nameColor(msg.senderRoleType)}`}>{msg.senderName}</p>
                        )}
                        <div className="bg-surface-container rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-base text-on-surface leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.time && <p className="text-xs text-on-surface-variant mt-1 ml-1">{msg.time}</p>}
                      </div>
                    </div>
                  )}
                  {msg.type === 'sent' && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%]">
                        <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3">
                          <p className="text-base text-white leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right">{msg.time}</p>}
                      </div>
                    </div>
                  )}
                  {msg.type === 'file' && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">Rapport_Medical.pdf</p>
                            <p className="text-xs text-on-surface-variant">245 KB</p>
                          </div>
                          <Download size={16} className="text-on-surface-variant" />
                        </div>
                        {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right">{msg.time}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="h-4" />
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Barre d'envoi — fixe en bas */}
          <div className="shrink-0 bg-surface border-t border-outline-variant px-4 py-7"
               style={{ paddingBottom: 'calc(56px + 2rem)' }}>
            <div className="flex items-center gap-2">
              <input type="text" placeholder={`Répondre à ${activeConv.name}...`}
                value={input} onChange={e => setInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              <button className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop membres */}
        {showMembers && (
          <div
            className={`fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${membersVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ willChange: 'opacity, backdrop-filter' }}
            onClick={closeMembers}
          />
        )}

        {/* Bottom sheet membres */}
        {showMembers && (
          <div className={`fixed bottom-0 inset-x-0 z-[51] bg-surface-container-lowest rounded-t-3xl max-h-[70vh] flex flex-col transition-transform duration-300 ${membersVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant shrink-0">
              <p className="text-lg font-bold text-on-surface">Membres ({activeConv.members?.length})</p>
              <button onClick={closeMembers} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeConv.members?.map((member, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors">
                  <div className={`w-12 h-12 rounded-full ${member.bg} flex items-center justify-center shrink-0`}>
                    <span className="font-bold text-base text-on-surface-variant">{member.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-bold ${nameColor(member.roleType)}`}>{member.name}</p>
                    <p className="text-sm text-on-surface-variant">{member.role}</p>
                  </div>
                </div>
              ))}
              <div className="h-6" />
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── Vue liste ── */
  return (
    <div className="space-y-4">

      <h1 className="text-3xl font-extrabold text-on-surface">Messages</h1>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input type="text" placeholder="Rechercher ou démarrer une conversation..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
        {(['Tous', 'Team', 'Staff'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-base font-semibold transition-all ${activeTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* IA — toujours en tête, bleu */}
      <div onClick={() => openConv(aiConv)}
        className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-all bg-primary/5 border border-primary/20 border-l-4 border-l-primary">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold">✦</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-base font-bold text-primary">{aiConv.name}</p>
          </div>
          <p className={`text-sm truncate ${aiConv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{aiConv.preview}</p>
        </div>
        {aiConv.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
      </div>

      {/* Séparateur visible */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Équipe & Staff</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Autres conversations */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-base text-on-surface-variant">Aucune conversation trouvée</div>
        ) : filtered.map(conv => {
          const accent = conv.isGroup ? null : roleAccent(conv.roleType as string);
          return (
            <div key={conv.id} onClick={() => openConv(conv)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant cursor-pointer active:scale-[0.99] transition-all hover:bg-surface-container">
              {conv.isGroup ? (
                <div className="w-14 h-14 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
                  <Users size={22} className="text-white/80" />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-full ${conv.avatarBg} flex items-center justify-center shrink-0`}>
                  <span className="font-bold text-base text-on-surface-variant">{conv.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`text-base font-bold truncate ${nameColor(conv.roleType as string)}`}>{conv.name}</p>
                    {conv.isGroup && conv.members && (
                      <span className="text-xs text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full shrink-0">{conv.members.length}</span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-2">{conv.time}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{conv.preview}</p>
              </div>
              {conv.unread && <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${conv.isGroup ? 'bg-primary' : (accent?.dot ?? 'bg-primary')}`} />}
            </div>
          );
        })}
      </div>

    </div>
  );
}