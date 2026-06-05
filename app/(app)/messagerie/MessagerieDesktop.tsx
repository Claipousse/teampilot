'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Send, Download, FileText, Users, X } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

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
  role?: string; members?: Member[]; unread?: boolean;
};

// ── Types API ────────────────────────────────────────────────────────────────

type ApiMessage = {
  id: number; conversation_id: number; sender_id: number | null;
  msg_type: 'text' | 'file' | 'system'; text: string | null; created_at: string;
  sender_initials: string | null; sender_bg: string | null;
  sender_name: string | null; sender_role_type: string | null;
};

type ApiMember = {
  user_id: number; first_name: string; last_name: string;
  initials: string; bg: string; role_type: string; role: string | null;
};

type ApiConversation = {
  id: number; name: string; category: 'team' | 'staff'; role_type: string;
  is_group: boolean; is_ai: boolean; initials: string; avatar_bg: string;
  role: string | null; preview: string | null; time: string | null;
  unread: boolean; members: ApiMember[] | null;
};

// ── Conversions ──────────────────────────────────────────────────────────────

function toMessage(m: ApiMessage, userId: number): Message {
  const time = m.created_at
    ? new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : undefined;
  if (m.msg_type === 'system') return { id: m.id, type: 'system', text: m.text ?? '' };
  if (m.msg_type === 'file')   return { id: m.id, type: 'file', time };
  return {
    id: m.id,
    type: m.sender_id === userId ? 'sent' : 'received',
    text: m.text ?? '',
    time,
    senderName:     m.sender_name     ?? undefined,
    senderInitials: m.sender_initials ?? undefined,
    senderBg:       m.sender_bg       ?? undefined,
    senderRoleType: (m.sender_role_type as RoleType) ?? undefined,
  };
}

function toConversation(c: ApiConversation): Conversation {
  return {
    id:       c.id,
    name:     c.name,
    time:     c.time ?? '',
    preview:  c.preview ?? '',
    initials: c.initials,
    avatarBg: c.avatar_bg,
    category: c.category,
    roleType: c.role_type as RoleType | 'group',
    isAI:     c.is_ai,
    isGroup:  c.is_group,
    role:     c.role ?? undefined,
    unread:   c.unread,
    members:  c.members?.map(m => ({
      name:     `${m.first_name} ${m.last_name}`,
      initials: m.initials,
      bg:       m.bg,
      role:     m.role ?? '',
      roleType: m.role_type as RoleType,
    })),
  };
}

// ── Helpers visuels ───────────────────────────────────────────────────────────

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

// ── Composant ─────────────────────────────────────────────────────────────────

export default function MessagerieDesktop() {
  const t = useT();
  const { user } = useAuth();

  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [activeConv,     setActiveConv]     = useState<Conversation | null>(null);
  const [activeTab,      setActiveTab]      = useState<Tab>('Tous');
  const [input,          setInput]          = useState('');
  const [search,         setSearch]         = useState('');
  const [showMembers,    setShowMembers]    = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [sending,        setSending]        = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiConv    = useMemo(() => conversations.find(c => c.isAI),   [conversations]);
  const otherConvs = useMemo(() => conversations.filter(c => !c.isAI), [conversations]);

  const filtered = useMemo(() => otherConvs.filter(conv => {
    const matchTab    = activeTab === 'Tous' || conv.category === activeTab.toLowerCase();
    const matchSearch = search === '' ||
      conv.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.preview.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [otherConvs, activeTab, search]);

  // Chargement initial des conversations
  useEffect(() => {
    fetch('/api/backend/messages/conversations')
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiConversation[]) => {
        const convs = data.map(toConversation);
        setConversations(convs);
        if (convs.length > 0) setActiveConv(convs[0]);
      });
  }, []);

  // Chargement des messages quand la conversation change
  useEffect(() => {
    if (!activeConv || !user) return;
    fetch(`/api/backend/messages/conversations/${activeConv.id}/messages`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiMessage[]) => setMessages(data.map(m => toMessage(m, user.id))));
  }, [activeConv?.id, user?.id]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => { messagesEndRef.current?.scrollIntoView(); }, [messages]);

  const selectConv = (conv: Conversation) => {
    setActiveConv(conv);
    if (!conv.isGroup) { setShowMembers(false); setMembersVisible(false); }
  };

  const openMembers  = () => { setShowMembers(true);  setTimeout(() => setMembersVisible(true),  10); };
  const closeMembers = () => { setMembersVisible(false); setTimeout(() => setShowMembers(false), 300); };

  const sendMsg = async () => {
    if (!input.trim() || !activeConv || sending || !user) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const r = await fetch(`/api/backend/messages/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (r.ok) {
        const msg: ApiMessage = await r.json();
        setMessages(prev => [...prev, toMessage(msg, user.id)]);
      }
    } finally {
      setSending(false);
    }
  };

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

        {/* IA — toujours en tête */}
        {aiConv && (
          <div onClick={() => selectConv(aiConv)}
            className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 shrink-0 ${
              activeConv?.id === aiConv.id ? 'border-primary bg-primary/5' : 'border-primary/50 bg-primary/5 hover:bg-primary/10'
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
        )}

        {/* Séparateur */}
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
                  activeConv?.id === conv.id
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

        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
            Sélectionnez une conversation
          </div>
        ) : (
          <>
            {/* Header conv */}
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

                    {messages.map(msg => (
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
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                      className="flex-1 px-5 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button
                      onClick={sendMsg}
                      disabled={sending || !input.trim()}
                      className="w-12 h-12 bg-primary hover:bg-primary-container rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-40">
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
          </>
        )}
      </div>
    </div>
  );
}
