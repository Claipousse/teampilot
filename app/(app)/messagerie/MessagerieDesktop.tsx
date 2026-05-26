'use client';

import { useState } from 'react';
import { Search, Send, Download, FileText, Users, X } from 'lucide-react';

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
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: 'Tactical AI',
    time: 'NOW',
    preview: 'Training intensity recommendation for today...',
    initials: '✦',
    avatarBg: 'bg-primary',
    isAI: true,
    messages: [
      { id: 1, type: 'received', text: "Good morning. Based on yesterday's session data, I recommend reducing training intensity by 15% for the midfield unit today.", time: '8:01 AM' },
      { id: 2, type: 'ai' },
      { id: 3, type: 'sent', text: 'Understood. Can you prepare a modified drill plan for the afternoon session?', time: '8:15 AM' },
      { id: 4, type: 'received', text: 'Drill plan generated and sent to your schedule. Focus on low-intensity possession drills and set pieces.', time: '8:16 AM' },
    ],
  },
  {
    id: 2,
    name: 'Coach Marcus',
    time: '10:45 AM',
    preview: 'Reviewing the defensive transition...',
    initials: 'CM',
    avatarBg: 'bg-surface-container-high',
    role: 'Head Coach',
    messages: [
      { id: 1, type: 'received', text: "Morning team. I've been reviewing the match footage from Sunday. Our defensive transition was lagging in the second half.", time: undefined },
      { id: 2, type: 'received', text: "I've tagged three specific clips where the gap between midfield and defense was over 25 meters.", time: '10:42 AM' },
      { id: 3, type: 'ai' },
      { id: 4, type: 'sent', text: "Copy that, Coach. I'll prepare the 4-4-2 block drills for the second session.", time: undefined },
      { id: 5, type: 'file', time: '10:55 AM' },
    ],
  },
  {
    id: 3,
    name: 'David Silva',
    time: '9:12 AM',
    preview: 'The recovery session helped a lot today.',
    initials: 'DS',
    avatarBg: 'bg-surface-container-high',
    role: 'Midfielder',
    messages: [
      { id: 1, type: 'received', text: 'The recovery session helped a lot today. Legs feel much better than yesterday.', time: '9:12 AM' },
      { id: 2, type: 'sent', text: 'Great to hear! Make sure you stay hydrated and get at least 8 hours tonight.', time: '9:20 AM' },
      { id: 3, type: 'received', text: 'Will do. Should I come in early for physio before the morning session?', time: '9:25 AM' },
      { id: 4, type: 'sent', text: "Yes, come in at 8:30. I'll let the medical team know.", time: '9:28 AM' },
    ],
  },
  {
    id: 4,
    name: 'Medical Staff',
    time: '8:30 AM',
    preview: 'Larsen is cleared for full contact training.',
    initials: 'MS',
    avatarBg: 'bg-secondary',
    role: 'Medical Team',
    messages: [
      { id: 1, type: 'received', text: 'Good news — Larsen is cleared for full contact training starting today.', time: '8:30 AM' },
      { id: 2, type: 'sent', text: "Excellent news! Can you send over his clearance report?", time: '8:45 AM' },
      { id: 3, type: 'file', time: '8:47 AM' },
      { id: 4, type: 'received', text: 'Report sent. He should ease into it today — no full sprints until Wednesday.', time: '8:50 AM' },
    ],
  },
  {
    id: 5,
    name: 'Staff Tactique',
    time: '12:30 PM',
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
      { id: 2, type: 'received', senderName: 'Coach Marcus', senderInitials: 'CM', senderBg: 'bg-surface-container-high', text: "Bonjour à tous. Check le planning de demain — entraînement à 9h suivi d'analyse vidéo.", time: '12:10 PM' },
      { id: 3, type: 'received', senderName: 'David Silva', senderInitials: 'DS', senderBg: 'bg-surface-container-high', text: 'Reçu Coach. Je serai là à 8h45 pour le warm-up.', time: '12:15 PM' },
      { id: 4, type: 'received', senderName: 'Medical Staff', senderInitials: 'MS', senderBg: 'bg-secondary', text: "Rappel : bilan de santé obligatoire pour tous avant l'entraînement.", time: '12:20 PM' },
      { id: 5, type: 'sent', text: "Parfait. J'ai préparé les exercices de pressing. On se retrouve à 9h.", time: '12:25 PM' },
      { id: 6, type: 'received', senderName: 'Tactical AI', senderInitials: '✦', senderBg: 'bg-primary', text: '⚡ Alerte fatigue détectée pour 3 joueurs. Recommandation : réduire l\'intensité de 20% pour la session du matin.', time: '12:28 PM' },
    ],
  },
];

const tabs = ['Team', 'Staff', 'Individual'];

export default function MessagerieDesktop() {
  const [activeTab, setActiveTab] = useState('Team');
  const [activeConv, setActiveConv] = useState<Conversation>(conversations[1]);
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className="flex h-full gap-0 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">

      {/* ── Liste ── */}
      <div className="w-80 shrink-0 border-r border-outline-variant flex flex-col">

        <div className="flex items-center justify-between px-5 py-5 border-b border-outline-variant">
          <p className="text-2xl font-bold text-on-surface">Inbox</p>
        </div>

        <div className="px-4 py-3 border-b border-outline-variant">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
            <input
              type="text"
              placeholder="Rechercher ou démarrer une conversation..."
              className="w-full pl-9 pr-4 py-3 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex mx-4 my-3 bg-surface-container rounded-xl p-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => { setActiveConv(conv); setShowMembers(false); }}
              className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 ${
                activeConv.id === conv.id
                  ? 'bg-primary/5 border-primary'
                  : 'border-transparent hover:bg-surface-container'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {conv.isGroup ? (
                  <div className="w-12 h-12 rounded-full bg-inverse-surface flex items-center justify-center">
                    <Users size={20} className="text-white/80" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full ${conv.avatarBg} flex items-center justify-center`}>
                    <span className={`font-bold ${conv.isAI ? 'text-white text-lg' : 'text-on-surface-variant text-base'}`}>
                      {conv.initials}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-base font-bold truncate ${activeConv.id === conv.id ? 'text-primary' : 'text-on-surface'}`}>
                      {conv.name}
                    </p>
                    {conv.isGroup && (
                      <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full">
                        {conv.members?.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-2">{conv.time}</span>
                </div>
                <p className={`text-sm truncate ${activeConv.id === conv.id ? 'text-primary/70' : 'text-on-surface-variant'}`}>
                  {conv.preview}
                </p>
              </div>
            </div>
          ))}
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
              <span className={`font-bold text-base ${activeConv.isAI ? 'text-white text-lg' : 'text-on-surface-variant'}`}>
                {activeConv.initials}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-on-surface">{activeConv.name}</p>
            {activeConv.isGroup && activeConv.members && (
              <p className="text-sm text-on-surface-variant truncate">
                {activeConv.members.map(m => m.name).join(' · ')}
              </p>
            )}
            {activeConv.role && !activeConv.isGroup && (
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">{activeConv.role}</p>
            )}
            {activeConv.isAI && (
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">AI Assistant</p>
            )}
          </div>
          {activeConv.isGroup && (
            <button
              onClick={() => setShowMembers(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                showMembers
                  ? 'bg-primary text-white'
                  : 'border border-outline-variant text-on-surface hover:bg-surface-container'
              }`}
            >
              <Users size={16} />
              Membres
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

              <div className="flex justify-center">
                <div className="px-5 py-2 bg-surface-container rounded-full text-sm font-semibold text-on-surface-variant">
                  MARDI 24 OCT
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
                    <div className="flex items-start gap-3 max-w-3xl">
                      <div className={`w-10 h-10 rounded-full ${msg.senderBg || activeConv.avatarBg} flex items-center justify-center shrink-0 mt-1`}>
                        <span className={`font-bold text-xs ${msg.senderBg === 'bg-primary' || activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                          {msg.senderInitials || activeConv.initials}
                        </span>
                      </div>
                      <div className="flex-1">
                        {activeConv.isGroup && msg.senderName && (
                          <p className="text-sm font-bold text-on-surface-variant mb-1 ml-1">{msg.senderName}</p>
                        )}
                        <div className="bg-surface-container rounded-2xl rounded-tl-sm px-5 py-4">
                          <p className="text-base text-on-surface leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.time && <p className="text-xs text-on-surface-variant mt-1 ml-1">{msg.time}</p>}
                      </div>
                    </div>
                  )}

                  {msg.type === 'ai' && (
                    <div className="max-w-3xl">
                      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[#F97316] text-lg">✦</span>
                          <p className="text-sm font-bold text-[#F97316] uppercase tracking-widest">AI Tactical Insight</p>
                        </div>
                        <p className="text-base text-on-surface leading-relaxed mb-4">
                          David Silva and Leo Mendez show significant fatigue levels in the 65th–80th minute window. AI suggests a defensive rotation at 60' to maintain transition speed.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-container rounded-xl p-4">
                            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Sprint Volume</p>
                            <p className="text-2xl font-extrabold text-error">-14% vs Avg</p>
                          </div>
                          <div className="bg-surface-container rounded-xl p-4">
                            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Recov. Time</p>
                            <p className="text-2xl font-extrabold text-error">+22s Delay</p>
                          </div>
                        </div>
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
                            <p className="text-base font-semibold text-on-surface">PM_Training_Load.pdf</p>
                            <p className="text-sm text-on-surface-variant">1.2 MB · TACTICAL REPORT</p>
                          </div>
                          <button>
                            <Download size={18} className="text-on-surface-variant" />
                          </button>
                        </div>
                        {msg.time && <p className="text-xs text-on-surface-variant mt-1 text-right mr-1">{msg.time} ✓✓</p>}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-outline-variant px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder={`Répondre à ${activeConv.name}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button className="w-12 h-12 bg-primary hover:bg-primary-container rounded-xl flex items-center justify-center transition-colors shrink-0">
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Panneau membres */}
          {showMembers && activeConv.isGroup && activeConv.members && (
            <div className="w-64 shrink-0 border-l border-outline-variant flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant">
                <p className="text-base font-bold text-on-surface">Membres ({activeConv.members.length})</p>
                <button
                  onClick={() => setShowMembers(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
                >
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeConv.members.map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors">
                    <div className={`w-10 h-10 rounded-full ${member.bg} flex items-center justify-center shrink-0`}>
                      <span className={`font-bold text-sm ${member.bg === 'bg-primary' ? 'text-white text-base' : 'text-on-surface-variant'}`}>
                        {member.initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{member.name}</p>
                      <p className="text-xs text-on-surface-variant">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}