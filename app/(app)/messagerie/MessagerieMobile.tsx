'use client';

import { useState } from 'react';
import { Search, ArrowLeft, Send, Download, FileText, Plus, Users, X } from 'lucide-react';

type Member = { name: string; initials: string; bg: string; role: string; };

type Message = {
  id: number;
  type: 'received' | 'sent' | 'ai' | 'file' | 'system';
  text?: string;
  time?: string;
  senderName?: string;
  senderInitials?: string;
  senderBg?: string;
};

type Conversation = {
  id: number;
  name: string;
  time: string;
  preview: string;
  initials: string;
  avatarBg: string;
  isAI?: boolean;
  isGroup?: boolean;
  role?: string;
  members?: Member[];
  unread?: boolean;
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: 'Tactical AI',
    time: 'Maintenant',
    preview: 'Training intensity recommendation for today...',
    initials: '✦',
    avatarBg: 'bg-primary',
    isAI: true,
    unread: true,
    messages: [
      { id: 1, type: 'received', text: "Good morning. Based on yesterday's session data, I recommend reducing training intensity by 15% for the midfield unit today.", time: '8:01' },
      { id: 2, type: 'ai' },
      { id: 3, type: 'sent', text: 'Understood. Can you prepare a modified drill plan for the afternoon session?', time: '8:15' },
      { id: 4, type: 'received', text: 'Drill plan generated and sent to your schedule. Focus on low-intensity possession drills.', time: '8:16' },
    ],
  },
  {
    id: 2,
    name: 'Coach Marcus',
    time: '10:45',
    preview: 'Reviewing the defensive transition...',
    initials: 'CM',
    avatarBg: 'bg-surface-container-high',
    role: 'Head Coach',
    unread: true,
    messages: [
      { id: 1, type: 'received', text: "Morning team. I've been reviewing the match footage from Sunday. Our defensive transition was lagging in the second half.", time: undefined },
      { id: 2, type: 'received', text: "I've tagged three specific clips where the gap between midfield and defense was over 25 meters.", time: '10:42' },
      { id: 3, type: 'ai' },
      { id: 4, type: 'sent', text: "Copy that, Coach. I'll prepare the 4-4-2 block drills for the second session.", time: undefined },
      { id: 5, type: 'file', time: '10:55' },
    ],
  },
  {
    id: 3,
    name: 'David Silva',
    time: '9:12',
    preview: 'The recovery session helped a lot today.',
    initials: 'DS',
    avatarBg: 'bg-surface-container-high',
    role: 'Midfielder',
    messages: [
      { id: 1, type: 'received', text: 'The recovery session helped a lot today. Legs feel much better than yesterday.', time: '9:12' },
      { id: 2, type: 'sent', text: 'Great to hear! Make sure you stay hydrated and get at least 8 hours tonight.', time: '9:20' },
      { id: 3, type: 'received', text: 'Will do. Should I come in early for physio before the morning session?', time: '9:25' },
      { id: 4, type: 'sent', text: "Yes, come in at 8:30. I'll let the medical team know.", time: '9:28' },
    ],
  },
  {
    id: 4,
    name: 'Medical Staff',
    time: '8:30',
    preview: 'Larsen is cleared for full contact training.',
    initials: 'MS',
    avatarBg: 'bg-secondary',
    role: 'Medical Team',
    messages: [
      { id: 1, type: 'received', text: 'Good news — Larsen is cleared for full contact training starting today.', time: '8:30' },
      { id: 2, type: 'sent', text: "Excellent news! Can you send over his clearance report?", time: '8:45' },
      { id: 3, type: 'file', time: '8:47' },
      { id: 4, type: 'received', text: 'Report sent. No full sprints until Wednesday.', time: '8:50' },
    ],
  },
  {
    id: 5,
    name: 'Staff Tactique',
    time: '12:30',
    preview: 'Coach Marcus: Check le planning de demain',
    initials: 'ST',
    avatarBg: 'bg-inverse-surface',
    isGroup: true,
    members: [
      { name: 'Coach Marcus', initials: 'CM', bg: 'bg-surface-container-high', role: 'Head Coach' },
      { name: 'David Silva', initials: 'DS', bg: 'bg-surface-container-high', role: 'Midfielder' },
      { name: 'Medical Staff', initials: 'MS', bg: 'bg-secondary', role: 'Medical Team' },
      { name: 'Tactical AI', initials: '✦', bg: 'bg-primary', role: 'AI Assistant' },
    ],
    messages: [
      { id: 1, type: 'system', text: 'Groupe créé par Coach Marcus · 4 membres' },
      { id: 2, type: 'received', senderName: 'Coach Marcus', senderInitials: 'CM', senderBg: 'bg-surface-container-high', text: "Bonjour à tous. Check le planning de demain — entraînement à 9h suivi d'analyse vidéo.", time: '12:10' },
      { id: 3, type: 'received', senderName: 'David Silva', senderInitials: 'DS', senderBg: 'bg-surface-container-high', text: 'Reçu Coach. Je serai là à 8h45 pour le warm-up.', time: '12:15' },
      { id: 4, type: 'received', senderName: 'Medical Staff', senderInitials: 'MS', senderBg: 'bg-secondary', text: "Rappel : bilan de santé obligatoire pour tous avant l'entraînement.", time: '12:20' },
      { id: 5, type: 'sent', text: "Parfait. J'ai préparé les exercices de pressing. On se retrouve à 9h.", time: '12:25' },
      { id: 6, type: 'received', senderName: 'Tactical AI', senderInitials: '✦', senderBg: 'bg-primary', text: "⚡ Alerte fatigue détectée pour 3 joueurs. Recommandation : réduire l'intensité de 20% pour la session du matin.", time: '12:28' },
    ],
  },
];

export default function MessagerieMobile() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Vue conversation ── */
  if (activeConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">

        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-outline-variant shrink-0">
          <button
            onClick={() => { setActiveConv(null); setShowMembers(false); }}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors shrink-0"
          >
            <ArrowLeft size={22} className="text-on-surface-variant" />
          </button>

          {activeConv.isGroup ? (
            <div className="w-10 h-10 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
              <Users size={18} className="text-white/80" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-full ${activeConv.avatarBg} flex items-center justify-center shrink-0`}>
              <span className={`font-bold text-sm ${activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                {activeConv.initials}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-on-surface truncate">{activeConv.name}</p>
            {activeConv.isGroup && activeConv.members && (
              <p className="text-xs text-on-surface-variant truncate">
                {activeConv.members.map(m => m.name).join(', ')}
              </p>
            )}
            {activeConv.role && !activeConv.isGroup && (
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{activeConv.role}</p>
            )}
            {activeConv.isAI && (
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">AI Assistant</p>
            )}
          </div>

          {activeConv.isGroup && (
            <button
              onClick={() => setShowMembers(v => !v)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                showMembers ? 'bg-primary' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <Users size={18} className={showMembers ? 'text-white' : 'text-on-surface-variant'} />
            </button>
          )}
        </div>

        {/* Panneau membres (modal) */}
        {showMembers && activeConv.members && (
          <div className="bg-surface-container-lowest border-b border-outline-variant px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-on-surface">Membres du groupe ({activeConv.members.length})</p>
              <button onClick={() => setShowMembers(false)}>
                <X size={16} className="text-on-surface-variant" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {activeConv.members.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-12 h-12 rounded-full ${m.bg} flex items-center justify-center`}>
                    <span className={`font-bold text-sm ${m.bg === 'bg-primary' ? 'text-white text-base' : 'text-on-surface-variant'}`}>
                      {m.initials}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface text-center w-16 truncate">{m.name}</p>
                  <p className="text-xs text-on-surface-variant text-center w-16 truncate">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
          <div className="flex justify-center">
            <div className="px-4 py-1.5 bg-surface-container rounded-full text-xs font-semibold text-on-surface-variant">
              Mardi 24 Oct
            </div>
          </div>

          {activeConv.messages.map(msg => (
            <div key={msg.id}>

              {msg.type === 'system' && (
                <div className="flex justify-center">
                  <div className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant">
                    {msg.text}
                  </div>
                </div>
              )}

              {msg.type === 'received' && (
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className={`w-8 h-8 rounded-full ${msg.senderBg || activeConv.avatarBg} flex items-center justify-center shrink-0`}>
                    <span className={`font-bold text-xs ${msg.senderBg === 'bg-primary' || activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                      {msg.senderInitials || activeConv.initials}
                    </span>
                  </div>
                  <div className="flex-1">
                    {activeConv.isGroup && msg.senderName && (
                      <p className="text-xs font-bold text-on-surface-variant mb-1 ml-1">{msg.senderName}</p>
                    )}
                    <div className="bg-surface-container rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-base text-on-surface leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.time && <p className="text-xs text-on-surface-variant mt-1 ml-1">{msg.time}</p>}
                  </div>
                </div>
              )}

              {msg.type === 'ai' && (
                <div className="max-w-[90%]">
                  <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#F97316]">✦</span>
                      <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest">AI Tactical Insight</p>
                    </div>
                    <p className="text-base text-on-surface leading-relaxed mb-3">
                      David Silva et Leo Mendez montrent des niveaux de fatigue élevés entre la 65e et 80e minute. Rotation défensive suggérée à la 60e.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-container rounded-xl p-3">
                        <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Sprint Vol.</p>
                        <p className="text-xl font-extrabold text-error">-14%</p>
                      </div>
                      <div className="bg-surface-container rounded-xl p-3">
                        <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Récup.</p>
                        <p className="text-xl font-extrabold text-error">+22s</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'sent' && (
                <div className="flex justify-end">
                  <div className="max-w-[85%]">
                    <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-base text-white leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right">{msg.time} ✓✓</p>}
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
                        <p className="text-sm font-semibold text-on-surface truncate">PM_Training_Load.pdf</p>
                        <p className="text-xs text-on-surface-variant">1.2 MB</p>
                      </div>
                      <Download size={16} className="text-on-surface-variant" />
                    </div>
                    {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right">{msg.time} ✓✓</p>}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-outline-variant pt-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Répondre à ${activeConv.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <button className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vue liste ── */
  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Messages</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
          <Plus size={22} className="text-on-surface-variant" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input
          type="text"
          placeholder="Rechercher ou démarrer une conversation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(conv => (
          <div
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${
              conv.isAI
                ? 'bg-[#FEF3EA] border border-[#F97316]/20 border-l-4 border-l-[#F97316]'
                : conv.isGroup
                  ? 'bg-surface-container-lowest border border-outline-variant border-l-4 border-l-inverse-surface hover:bg-surface-container'
                  : 'bg-surface-container-lowest border border-outline-variant hover:bg-surface-container'
            }`}
          >
            {conv.isGroup ? (
              <div className="w-14 h-14 rounded-full bg-inverse-surface flex items-center justify-center shrink-0">
                <Users size={22} className="text-white/80" />
              </div>
            ) : (
              <div className={`w-14 h-14 rounded-full ${conv.avatarBg} flex items-center justify-center shrink-0`}>
                <span className={`font-bold ${conv.isAI ? 'text-white text-xl' : 'text-on-surface-variant text-base'}`}>
                  {conv.initials}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-on-surface truncate">{conv.name}</p>
                  {conv.isGroup && (
                    <span className="text-xs text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full shrink-0">
                      {conv.members?.length}
                    </span>
                  )}
                </div>
                <span className="text-xs text-on-surface-variant shrink-0 ml-2">{conv.time}</span>
              </div>
              <p className={`text-sm truncate ${conv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                {conv.preview}
              </p>
            </div>

            {conv.unread && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}