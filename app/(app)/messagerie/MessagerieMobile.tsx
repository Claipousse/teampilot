'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ArrowLeft, Send, Download, FileText, Users, X } from 'lucide-react';
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

export default function MessagerieMobile() {
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

  const aiConv    = useMemo(() => conversations.find(c => c.isAI),    [conversations]);
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
      .then((data: ApiConversation[]) => setConversations(data.map(toConversation)));
  }, []);

  // Chargement des messages quand la conversation change
  useEffect(() => {
    if (!activeConv || !user) return;
    fetch(`/api/backend/messages/conversations/${activeConv.id}/messages`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiMessage[]) => setMessages(data.map(m => toMessage(m, user.id))));
  }, [activeConv?.id, user?.id]);

  useEffect(() => {
    if (activeConv) messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  const openConv = (conv: Conversation) => {
    setActiveConv(conv);
    setShowMembers(false);
    setMembersVisible(false);
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

              {messages.map(msg => (
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
              <input type="text" placeholder={t.messaging.typeMessage}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
                className="flex-1 px-4 py-3 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              <button
                onClick={sendMsg}
                disabled={sending || !input.trim()}
                className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40">
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
              <p className="text-lg font-bold text-on-surface">{t.messaging.members} ({activeConv.members?.length})</p>
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
        <input type="text" placeholder={t.messaging.searchPlaceholder}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
        {(['Tous', 'Team', 'Staff'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-base font-semibold transition-all ${activeTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab === 'Tous' ? t.messaging.tabAll : tab === 'Team' ? t.messaging.tabTeam : t.messaging.tabStaff}
          </button>
        ))}
      </div>

      {/* IA — toujours en tête */}
      {aiConv && (
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
      )}

      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.messaging.teamAndStaff}</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Autres conversations */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-base text-on-surface-variant">{t.messaging.noConversation}</div>
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
