'use client';

import { useState } from 'react';
import { Search, Pencil, Plus, Grid2x2, Smile, Send, Download, FileText } from 'lucide-react';

type Message = {
  id: number;
  type: 'received' | 'sent' | 'ai' | 'file';
  text?: string;
  time?: string;
};

type Conversation = {
  id: number;
  name: string;
  time: string;
  preview: string;
  initials: string;
  avatarBg: string;
  isAI?: boolean;
  online?: boolean;
  role?: string;
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
      { id: 1, type: 'received', text: 'Good morning. Based on yesterday\'s session data, I recommend reducing training intensity by 15% for the midfield unit today. Fatigue index is elevated.', time: '8:01 AM' },
      { id: 2, type: 'ai' },
      { id: 3, type: 'sent', text: 'Understood. Can you prepare a modified drill plan for the afternoon session?', time: '8:15 AM' },
      { id: 4, type: 'received', text: 'Drill plan generated and sent to your schedule. Focus on low-intensity possession drills and set pieces. Avoid sprinting exercises for Rice and Saka.', time: '8:16 AM' },
    ],
  },
  {
    id: 2,
    name: 'Coach Marcus',
    time: '10:45 AM',
    preview: 'Reviewing the defensive transition...',
    initials: 'CM',
    avatarBg: 'bg-surface-container-high',
    online: true,
    role: 'Head Coach',
    messages: [
      { id: 1, type: 'received', text: 'Morning team. I\'ve been reviewing the match footage from Sunday. Our defensive transition was lagging in the second half.', time: undefined },
      { id: 2, type: 'received', text: 'I\'ve tagged three specific clips where the gap between midfield and defense was over 25 meters. Let\'s address this in today\'s walk-through.', time: '10:42 AM' },
      { id: 3, type: 'ai' },
      { id: 4, type: 'sent', text: 'Copy that, Coach. I\'ll prepare the 4-4-2 block drills for the second session. Should I share the updated load reports with the medical staff?', time: undefined },
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
      { id: 2, type: 'sent', text: 'Great to hear! Make sure you stay hydrated and get at least 8 hours tonight. Big session tomorrow.', time: '9:20 AM' },
      { id: 3, type: 'received', text: 'Will do. Should I come in early for physio before the morning session?', time: '9:25 AM' },
      { id: 4, type: 'sent', text: 'Yes, come in at 8:30. I\'ll let the medical team know.', time: '9:28 AM' },
    ],
  },
  {
    id: 4,
    name: 'Medical Staff',
    time: '8:30 AM',
    preview: 'Larsen is cleared for full contact training.',
    initials: '+',
    avatarBg: 'bg-secondary',
    role: 'Medical Team',
    messages: [
      { id: 1, type: 'received', text: 'Good news — Larsen is cleared for full contact training starting today. His hamstring has fully recovered.', time: '8:30 AM' },
      { id: 2, type: 'sent', text: 'Excellent news! I\'ll add him back to the squad list for Saturday. Can you send over his clearance report?', time: '8:45 AM' },
      { id: 3, type: 'file', time: '8:47 AM' },
      { id: 4, type: 'received', text: 'Report sent. He should ease into it today — no full sprints until Wednesday.', time: '8:50 AM' },
    ],
  },
];

const tabs = ['Team', 'Staff', 'Individual'];

export default function MessageriePage() {
  const [activeTab, setActiveTab] = useState('Team');
  const [activeConv, setActiveConv] = useState<Conversation>(conversations[1]);
  const [input, setInput] = useState('');

  return (
    <div className="flex h-full gap-0 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">

      {/* ── Liste conversations ── */}
      <div className="w-80 shrink-0 border-r border-outline-variant flex flex-col">

        <div className="flex items-center justify-between px-5 py-5 border-b border-outline-variant">
          <p className="text-2xl font-bold text-on-surface">Inbox</p>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
            <Pencil size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-outline-variant">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
            <input
              type="text"
              placeholder="Search messages..."
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
              onClick={() => setActiveConv(conv)}
              className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 ${
                activeConv.id === conv.id
                  ? 'bg-primary/5 border-primary'
                  : 'border-transparent hover:bg-surface-container'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full ${conv.avatarBg} flex items-center justify-center`}>
                  <span className={`font-bold ${conv.isAI ? 'text-white text-lg' : 'text-on-surface-variant text-base'}`}>
                    {conv.initials}
                  </span>
                </div>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-surface-container-lowest rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-base font-bold truncate ${activeConv.id === conv.id ? 'text-primary' : 'text-on-surface'}`}>
                    {conv.name}
                  </p>
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
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-outline-variant shrink-0">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full ${activeConv.avatarBg} flex items-center justify-center`}>
              <span className={`font-bold text-base ${activeConv.isAI ? 'text-white text-lg' : 'text-on-surface-variant'}`}>
                {activeConv.initials}
              </span>
            </div>
            {activeConv.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-surface-container-lowest rounded-full" />
            )}
          </div>
          <div>
            <p className="text-xl font-bold text-on-surface">{activeConv.name}</p>
            {activeConv.online && (
              <p className="text-sm font-semibold text-secondary uppercase tracking-wider">Online · {activeConv.role}</p>
            )}
            {activeConv.role && !activeConv.online && (
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">{activeConv.role}</p>
            )}
            {activeConv.isAI && (
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">AI Assistant</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          <div className="flex justify-center">
            <div className="px-5 py-2 bg-surface-container rounded-full text-sm font-semibold text-on-surface-variant">
              TUESDAY, OCT 24
            </div>
          </div>

          {activeConv.messages.map(msg => (
            <div key={msg.id}>

              {msg.type === 'received' && (
                <div className="flex items-start gap-4 max-w-3xl">
                  <div className={`w-11 h-11 rounded-full ${activeConv.avatarBg} flex items-center justify-center shrink-0 mt-1`}>
                    <span className={`font-bold text-sm ${activeConv.isAI ? 'text-white' : 'text-on-surface-variant'}`}>
                      {activeConv.initials}
                    </span>
                  </div>
                  <div>
                    <div className="bg-surface-container rounded-2xl rounded-tl-sm px-6 py-4">
                      <p className="text-lg text-on-surface leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.time && <p className="text-sm text-on-surface-variant mt-1.5 ml-2">{msg.time}</p>}
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
                    <p className="text-lg text-on-surface leading-relaxed mb-4">
                      Based on Sunday's heatmaps, David Silva and Leo Mendez show significant fatigue levels in the 65th–80th minute window. AI suggests a defensive rotation at 60' to maintain transition speed.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container rounded-xl p-4">
                        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Sprint Volume</p>
                        <p className="text-3xl font-extrabold text-error">-14% vs Avg</p>
                      </div>
                      <div className="bg-surface-container rounded-xl p-4">
                        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Recov. Time</p>
                        <p className="text-3xl font-extrabold text-error">+22s Delay</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'sent' && (
                <div className="flex justify-end">
                  <div className="max-w-3xl">
                    <div className="bg-primary rounded-2xl rounded-tr-sm px-6 py-4">
                      <p className="text-lg text-white leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.time && <p className="text-sm text-on-surface-variant mt-1.5 text-right mr-2">{msg.time}</p>}
                  </div>
                </div>
              )}

              {msg.type === 'file' && (
                <div className="flex justify-end">
                  <div className="max-w-sm">
                    <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-tr-sm px-5 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={22} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-on-surface">PM_Training_Load.pdf</p>
                        <p className="text-sm text-on-surface-variant">1.2 MB · TACTICAL REPORT</p>
                      </div>
                      <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors">
                        <Download size={18} className="text-on-surface-variant" />
                      </button>
                    </div>
                    {msg.time && <p className="text-sm text-on-surface-variant mt-1.5 text-right mr-2">{msg.time} ✓✓</p>}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-outline-variant px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shrink-0">
              <Plus size={22} className="text-on-surface-variant" />
            </button>
            <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shrink-0">
              <Grid2x2 size={22} className="text-on-surface-variant" />
            </button>
            <input
              type="text"
              placeholder={`Reply to ${activeConv.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-5 py-3.5 bg-surface-container rounded-xl text-lg text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <button className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors shrink-0">
              <Smile size={22} className="text-on-surface-variant" />
            </button>
            <button className="w-12 h-12 bg-primary hover:bg-primary-container rounded-xl flex items-center justify-center transition-colors shrink-0">
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}