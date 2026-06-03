'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Send, Download, FileText, Users, X } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';

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
      { id: 5, type: 'received', text: 'Julian R. absent 2 séances (blessure). Alex M. absent 1 séance (suspension préventive). Tous les autres présents.', time: '8:11' },
    ],
  },
  {
    id: 2, name: 'Coach Marcus', category: 'staff', roleType: 'coach',
    time: '10:45', preview: 'On reprend à 14h sur le terrain 2.',
    initials: 'CM', avatarBg: 'bg-surface-container-high', role: 'Head Coach', unread: true,
    messages: [
      { id: 1, type: 'received', text: "Bonjour. La séance du matin est annulée suite aux conditions météo. On reprend à 14h sur le terrain 2 couvert.", time: '9:30' },
      { id: 2, type: 'sent',     text: "Reçu. Je préviens les joueurs tout de suite.", time: '9:35' },
      { id: 3, type: 'received', text: "Merci. Prévois aussi une séance vidéo à 13h pour analyser le dernier match.", time: '9:36' },
      { id: 4, type: 'sent',     text: "C'est noté. La salle de projection est disponible à 13h.", time: '9:40' },
      { id: 5, type: 'received', text: "On reprend à 14h sur le terrain 2.", time: '10:45' },
    ],
  },
  {
    id: 3, name: 'Sarah Bernard', category: 'staff', roleType: 'staff',
    time: '9:12', preview: 'Bilan médical de Julian R. après scanner.',
    initials: 'SB', avatarBg: 'bg-surface-container-high', role: 'Médecin',
    messages: [
      { id: 1, type: 'received', text: "Bonjour. Le scanner de Julian R. vient de revenir. Lésion de grade 2 aux ischio-jambiers. Repos complet 3 semaines minimum.", time: '8:45' },
      { id: 2, type: 'sent',     text: "Merci Sarah. Il sera donc forfait pour les 2 prochains matchs ?", time: '8:50' },
      { id: 3, type: 'received', text: "Oui, au minimum. On réévalue dans 10 jours. Je vous envoie le rapport complet.", time: '8:52' },
      { id: 4, type: 'file',     time: '8:53' },
      { id: 5, type: 'sent',     text: "Bien reçu. Gardez-moi informé de l'évolution.", time: '9:12' },
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
      { id: 2, type: 'received', senderName: 'Coach Marcus',  senderInitials: 'CM', senderBg: 'bg-surface-container-high', senderRoleType: 'coach', text: "Réunion de staff demain matin à 9h. Point sur les blessés et préparation match samedi.", time: '18:00' },
      { id: 3, type: 'received', senderName: 'Sarah Bernard', senderInitials: 'SB', senderBg: 'bg-surface-container-high', senderRoleType: 'staff', text: "Je serai présente. Je prépare un point sur Julian R. et Tom O.", time: '18:15' },
      { id: 4, type: 'received', senderName: 'Jean Dupont',   senderInitials: 'JD', senderBg: 'bg-surface-container-high', senderRoleType: 'staff', text: "Ok pour moi. Tom O. a bien récupéré depuis hier.", time: '18:30' },
      { id: 5, type: 'sent',     text: "Parfait. Salle de réunion A.", time: '18:35' },
      { id: 6, type: 'received', senderName: 'Coach Marcus',  senderInitials: 'CM', senderBg: 'bg-surface-container-high', senderRoleType: 'coach', text: "Réunion demain 9h. À demain.", time: '19:00' },
    ],
  },
  {
    id: 5, name: 'Marcus V.', category: 'team', roleType: 'player',
    time: '11:20', preview: 'Présent à 8h30 demain Coach.',
    initials: 'MV', avatarBg: 'bg-surface-container-high', role: 'Milieu Central · #8', unread: true,
    messages: [
      { id: 1, type: 'sent',     text: "Marcus, peux-tu venir 30 minutes plus tôt demain pour un travail sur les transitions ?", time: '10:45' },
      { id: 2, type: 'received', text: "Bien sûr Coach, pas de problème. À quelle heure ?", time: '10:50' },
      { id: 3, type: 'sent',     text: "8h30, avant la séance collective.", time: '10:52' },
      { id: 4, type: 'received', text: "Présent à 8h30 demain Coach.", time: '11:20' },
    ],
  },
  {
    id: 6, name: 'Kevin L.', category: 'team', roleType: 'player',
    time: '9:30', preview: "D'accord, je ferai attention.",
    initials: 'KL', avatarBg: 'bg-surface-container-high', role: 'Attaquant Centre · #9',
    messages: [
      { id: 1, type: 'sent',     text: "Kevin, excellente semaine d'entraînement. Continue sur cette lancée pour samedi.", time: '9:00' },
      { id: 2, type: 'received', text: "Merci Coach ! Je me sens vraiment bien en ce moment. Hâte d'être au match.", time: '9:10' },
      { id: 3, type: 'sent',     text: "Parfait. Pense à bien récupérer jeudi et vendredi. Pas de surcharge.", time: '9:25' },
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
      { id: 3, type: 'received', senderName: 'Marcus V.', senderInitials: 'MV', senderBg: 'bg-surface-container-high', senderRoleType: 'player', text: "Reçu Coach. On sera là.", time: '17:05' },
      { id: 4, type: 'received', senderName: 'Stefan K.', senderInitials: 'SK', senderBg: 'bg-surface-container-high', senderRoleType: 'player', text: "Présent. Peut-on amener nos familles en tribune ?", time: '17:10' },
      { id: 5, type: 'sent',     text: "Oui, 2 places par joueur au guichet. Parlez à Marc pour les billets.", time: '17:15' },
      { id: 6, type: 'received', senderName: 'Kevin L.', senderInitials: 'KL', senderBg: 'bg-surface-container-high', senderRoleType: 'player', text: "On va gagner samedi ! 💪", time: '17:20' },
    ],
  },
  {
    id: 8, name: 'Stefan K.', category: 'team', roleType: 'player',
    time: 'Hier', preview: "Merci pour le retour, je travaille dessus.",
    initials: 'SK', avatarBg: 'bg-surface-container-high', role: 'Gardien de but · #1',
    messages: [
      { id: 1, type: 'sent',     text: "Stefan, bon match la semaine dernière. Un point à travailler : tes sorties sur les centres.", time: '14:00' },
      { id: 2, type: 'received', text: "Oui j'ai revu les images. Je dois être plus décisif sur les ballons aériens.", time: '14:15' },
      { id: 3, type: 'sent',     text: "On travaille ça vendredi avec Jean en séance spécifique gardiens.", time: '14:20' },
      { id: 4, type: 'received', text: "Merci pour le retour, je travaille dessus.", time: '14:25' },
    ],
  },
];

export default function MessagerieDesktop() {
  const t = useT();
  const [activeTab, setActiveTab]           = useState<Tab>('Tous');
  const [activeConv, setActiveConv]         = useState<Conversation>(ALL_CONVERSATIONS[1]);
  const [input, setInput]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [showMembers, setShowMembers]       = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView(); }, [activeConv.id]);

  const selectConv = (conv: Conversation) => {
    setActiveConv(conv);
    if (!conv.isGroup) { setShowMembers(false); setMembersVisible(false); }
  };

  const openMembers  = () => { setShowMembers(true); setTimeout(() => setMembersVisible(true), 10); };
  const closeMembers = () => { setMembersVisible(false); setTimeout(() => setShowMembers(false), 300); };

  return (
    <div className="flex h-full bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">

      {/* ── Liste ── */}
      <div className="w-80 shrink-0 border-r border-outline-variant flex flex-col">

        <div className="px-5 py-5 border-b border-outline-variant shrink-0">
          <p className="text-2xl font-bold text-on-surface">{t.messaging.inbox}</p>
        </div>

        <div className="px-4 py-3 border-b border-outline-variant shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
            <input type="text" placeholder={t.messaging.searchPlaceholder} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex mx-4 my-3 bg-surface-container rounded-xl p-1 gap-1 shrink-0">
          {(['Tous', 'Team', 'Staff'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {tab === 'Tous' ? t.messaging.tabAll : tab === 'Team' ? t.messaging.tabTeam : t.messaging.tabStaff}
            </button>
          ))}
        </div>

        {/* IA — toujours en tête, retour bleu */}
        <div onClick={() => selectConv(aiConv)}
          className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 shrink-0 ${
            activeConv.id === aiConv.id ? 'border-primary bg-primary/5' : 'border-primary/50 bg-primary/5 hover:bg-primary/10'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">✦</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-bold text-primary">{aiConv.name}</p>
              {aiConv.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ml-2" />}
            </div>
            <p className="text-sm truncate text-on-surface-variant">{aiConv.preview}</p>
          </div>
        </div>

        {/* Séparateur visible */}
        <div className="flex items-center gap-3 px-4 py-2 shrink-0">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.messaging.teamAndStaff}</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Autres conversations */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-on-surface-variant">{t.messaging.noConversation}</div>
          ) : filtered.map(conv => {
            const accent = conv.isGroup ? null : roleAccent(conv.roleType as string);
            return (
              <div key={conv.id} onClick={() => selectConv(conv)}
                className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 ${
                  activeConv.id === conv.id
                    ? `${accent?.bg ?? 'bg-surface-container'} ${accent?.border ?? 'border-outline-variant'}`
                    : 'border-transparent hover:bg-surface-container'
                }`}
              >
                {conv.isGroup ? (
                  <div className="w-12 h-12 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
                    <Users size={20} className="text-white/80" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full ${conv.avatarBg} flex items-center justify-center shrink-0`}>
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
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {conv.unread && <div className={`w-2.5 h-2.5 rounded-full ${conv.isGroup ? 'bg-primary' : (accent?.dot ?? 'bg-primary')}`} />}
                      <span className="text-xs text-on-surface-variant">{conv.time}</span>
                    </div>
                  </div>
                  <p className={`text-sm truncate ${conv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{conv.preview}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-outline-variant shrink-0">
          {activeConv.isGroup ? (
            <div className="w-12 h-12 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
              <Users size={22} className="text-white/80" />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-full ${activeConv.avatarBg} flex items-center justify-center shrink-0`}>
              <span className={`font-bold text-base ${activeConv.isAI ? 'text-white text-lg' : 'text-on-surface-variant'}`}>{activeConv.initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-bold ${nameColor(activeConv.isAI ? 'ai' : activeConv.roleType as string)}`}>{activeConv.name}</p>
            {activeConv.isGroup && activeConv.members && (
              <p className="text-sm text-on-surface-variant truncate">{activeConv.members.map(m => m.name).join(' · ')}</p>
            )}
            {activeConv.role && !activeConv.isGroup && (
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">{activeConv.role}</p>
            )}
            {activeConv.isAI && (
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">AI Assistant</p>
            )}
          </div>
          {activeConv.isGroup && (
            <button onClick={showMembers ? closeMembers : openMembers}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${showMembers ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface hover:bg-surface-container'}`}>
              <Users size={16} /> {t.messaging.members}
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col justify-end min-h-full gap-4">
                <div className="flex justify-center">
                  <div className="px-5 py-2 bg-surface-container rounded-full text-sm font-semibold text-on-surface-variant">Aujourd'hui</div>
                </div>

                {activeConv.messages.map(msg => (
                  <div key={msg.id}>

                    {msg.type === 'system' && (
                      <div className="flex justify-center">
                        <div className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant">{msg.text}</div>
                      </div>
                    )}

                    {msg.type === 'received' && (
                      <div className="flex items-start gap-3 max-w-3xl">
                        <div className={`w-10 h-10 rounded-full ${msg.senderBg || activeConv.avatarBg} flex items-center justify-center shrink-0 mt-1`}>
                          <span className={`font-bold text-xs ${activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                            {msg.senderInitials || activeConv.initials}
                          </span>
                        </div>
                        <div className="flex-1">
                          {activeConv.isGroup && msg.senderName && (
                            <p className={`text-sm font-bold mb-1 ml-1 ${nameColor(msg.senderRoleType)}`}>{msg.senderName}</p>
                          )}
                          <div className="bg-surface-container rounded-2xl rounded-tl-sm px-5 py-4">
                            <p className="text-base text-on-surface leading-relaxed">{msg.text}</p>
                          </div>
                          {msg.time && <p className="text-xs text-on-surface-variant mt-1 ml-1">{msg.time}</p>}
                        </div>
                      </div>
                    )}

                    {msg.type === 'sent' && (
                      <div className="flex justify-end">
                        <div className="max-w-3xl">
                          <div className="bg-primary rounded-2xl rounded-tr-sm px-5 py-4">
                            <p className="text-base text-white leading-relaxed">{msg.text}</p>
                          </div>
                          {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right mr-1">{msg.time}</p>}
                        </div>
                      </div>
                    )}

                    {msg.type === 'file' && (
                      <div className="flex justify-end">
                        <div className="max-w-sm">
                          <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-tr-sm px-5 py-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                              <FileText size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-on-surface">Rapport_Medical.pdf</p>
                              <p className="text-sm text-on-surface-variant">245 KB · Document médical</p>
                            </div>
                            <button><Download size={18} className="text-on-surface-variant" /></button>
                          </div>
                          {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right mr-1">{msg.time}</p>}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-outline-variant px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <input type="text" placeholder={t.messaging.typeMessage}
                  value={input} onChange={e => setInput(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button className="w-12 h-12 bg-primary hover:bg-primary-container rounded-xl flex items-center justify-center transition-colors shrink-0">
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Panneau membres animé */}
          <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${showMembers ? 'w-96 opacity-100' : 'w-0 opacity-0'}`}>
            <div className="w-96 h-full border-l border-outline-variant flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-5 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.messaging.members} {activeConv.members ? `(${activeConv.members.length})` : ''}</p>
                <button onClick={closeMembers} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
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
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}