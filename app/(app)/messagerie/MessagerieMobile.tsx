'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ArrowLeft, Send, Download, FileText, Users, X, Plus, MessageSquare, ChevronRight, Check } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

type RoleType = 'player' | 'coach' | 'staff' | 'ai';
type Tab = 'Tous' | 'Team' | 'Staff';
type CreateMode = 'conversation' | 'group' | null;
type CreateTab  = 'joueurs' | 'staff' | 'coachs';

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

type ApiUserCard = {
  id: number; first_name: string; last_name: string;
  user_type: string; is_admin: boolean; role: string | null;
};

type ApiUsersGrouped = {
  coaches: ApiUserCard[]; staff: ApiUserCard[]; players: ApiUserCard[];
};

type ApiAIChatResponse = {
  conversation_id: number;
  user_message: ApiMessage;
  ai_message: ApiMessage;
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

function userRoleType(u: ApiUserCard): RoleType {
  if (u.user_type === 'player') return 'player';
  if (u.is_admin || (u.role && u.role.toLowerCase().includes('coach'))) return 'coach';
  return 'staff';
}

// ── Conversation IA virtuelle ────────────────────────────────────────────────
const VIRTUAL_AI_CONV: Conversation = {
  id: -1,
  name: 'Tactical AI',
  time: '',
  preview: 'Votre assistant football IA',
  initials: '✦',
  avatarBg: 'bg-primary',
  category: 'staff',
  roleType: 'ai',
  isAI: true,
  isGroup: false,
};

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
  const [aiTyping,       setAiTyping]       = useState(false);

  // Create modal
  const [createMode,    setCreateMode]    = useState<CreateMode>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [createTab,     setCreateTab]     = useState<CreateTab>('joueurs');
  const [createSearch,  setCreateSearch]  = useState('');
  const [plusOpen,      setPlusOpen]      = useState(false);
  const [usersGrouped,  setUsersGrouped]  = useState<ApiUsersGrouped | null>(null);
  const [groupSelected, setGroupSelected] = useState<Set<number>>(new Set());
  const [groupName,     setGroupName]     = useState('');
  const [creatingConv,  setCreatingConv]  = useState(false);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const newEmptyConvRef = useRef<number | null>(null);

  const aiConv      = useMemo(() => conversations.find(c => c.isAI),    [conversations]);
  const displayAiConv = aiConv ?? VIRTUAL_AI_CONV;
  const otherConvs  = useMemo(() => conversations.filter(c => !c.isAI), [conversations]);

  const filtered = useMemo(() => otherConvs.filter(conv => {
    const matchTab    = activeTab === 'Tous' || conv.category === activeTab.toLowerCase();
    const matchSearch = search === '' ||
      conv.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.preview.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [otherConvs, activeTab, search]);

  // Chargement initial
  useEffect(() => {
    fetch('/api/backend/messages/conversations')
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiConversation[]) => setConversations(data.map(toConversation)));
  }, []);

  // Chargement messages
  useEffect(() => {
    if (!activeConv || !user) return;
    if (activeConv.id === -1) { setMessages([]); return; }
    fetch(`/api/backend/messages/conversations/${activeConv.id}/messages`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiMessage[]) => setMessages(data.map(m => toMessage(m, user.id))));
    window.dispatchEvent(new CustomEvent('dismiss-message-notifs', { detail: { convName: activeConv.name } }));
  }, [activeConv?.id, user?.id]);

  useEffect(() => {
    if (activeConv) messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  // Polling conversations (5s)
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/backend/messages/conversations')
        .then(r => r.ok ? r.json() : null)
        .then((data: ApiConversation[] | null) => { if (data) setConversations(data.map(toConversation)); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Polling messages actifs (5s)
  useEffect(() => {
    if (!activeConv || !user || activeConv.id === -1) return;
    const convId = activeConv.id;
    const userId = user.id;
    const id = setInterval(() => {
      fetch(`/api/backend/messages/conversations/${convId}/messages`)
        .then(r => r.ok ? r.json() : null)
        .then((data: ApiMessage[] | null) => {
          if (!data) return;
          setMessages(prev => {
            const lastId = prev.length > 0 ? prev[prev.length - 1].id : -1;
            const newMsgs = data.map(m => toMessage(m, userId));
            return newMsgs.length > 0 && newMsgs[newMsgs.length - 1].id > lastId ? newMsgs : prev;
          });
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [activeConv?.id, user?.id]);

  const cleanupEmptyConv = async () => {
    const emptyId = newEmptyConvRef.current;
    if (emptyId === null) return;
    newEmptyConvRef.current = null;
    const hasMessages = messages.some(m => m.type !== 'system');
    if (!hasMessages) {
      await fetch(`/api/backend/messages/conversations/${emptyId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== emptyId));
    }
  };

  const openConv = async (conv: Conversation) => {
    if (activeConv?.id === conv.id) return;
    await cleanupEmptyConv();
    setActiveConv(conv);
    setShowMembers(false);
    setMembersVisible(false);
    setCreateMode(null);
    setPlusOpen(false);
  };

  const backToList = async () => {
    await cleanupEmptyConv();
    setActiveConv(null);
  };

  const openMembers  = () => { setShowMembers(true);  setTimeout(() => setMembersVisible(true),  10); };
  const closeMembers = () => { setMembersVisible(false); setTimeout(() => setShowMembers(false), 300); };

  const openCreateMode = async (mode: CreateMode) => {
    setPlusOpen(false);
    setGroupSelected(new Set());
    setGroupName('');
    setCreateTab('joueurs');
    setCreateSearch('');
    setCreateMode(mode);
    setTimeout(() => setCreateVisible(true), 10);
    if (!usersGrouped) {
      const r = await fetch('/api/backend/messages/users');
      if (r.ok) setUsersGrouped(await r.json());
    }
  };

  const closeCreate = () => {
    setCreateVisible(false);
    setTimeout(() => setCreateMode(null), 200);
  };

  const startConversationWith = async (userId: number) => {
    if (creatingConv) return;
    setCreatingConv(true);
    try {
      const r = await fetch('/api/backend/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_ids: [userId], is_group: false }),
      });
      if (!r.ok) return;
      const data: ApiConversation = await r.json();
      const conv = toConversation(data);
      const existing = conversations.find(c => c.id === conv.id);
      if (existing) {
        closeCreate();
        setActiveConv(existing);
      } else {
        newEmptyConvRef.current = conv.id;
        setConversations(prev => [conv, ...prev]);
        closeCreate();
        setActiveConv(conv);
      }
    } finally {
      setCreatingConv(false);
    }
  };

  const createGroup = async () => {
    if (creatingConv || groupSelected.size < 2) return;
    setCreatingConv(true);
    try {
      const r = await fetch('/api/backend/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_ids: Array.from(groupSelected),
          is_group: true,
          group_name: groupName.trim() || null,
        }),
      });
      if (!r.ok) return;
      const data: ApiConversation = await r.json();
      const conv = toConversation(data);
      newEmptyConvRef.current = conv.id;
      setConversations(prev => [conv, ...prev]);
      closeCreate();
      setActiveConv(conv);
    } finally {
      setCreatingConv(false);
    }
  };

  const toggleGroupUser = (id: number) => {
    setGroupSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hideConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/backend/messages/conversations/${convId}/leave`, { method: 'POST' });
    setConversations(prev => prev.filter(c => c.id !== convId));
  };

  const sendMsg = async () => {
    if (!input.trim() || !activeConv || sending || !user) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      if (activeConv.isAI) {
        const optimisticId = Date.now();
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { id: optimisticId, type: 'sent' as const, text, time: now }]);
        setAiTyping(true);

        const r = await fetch('/api/backend/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        setAiTyping(false);

        if (r.status === 429 || r.status === 503) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'received' as const,
            text: "Je suis temporairement indisponible. Réessaie dans un instant.",
          }]);
          return;
        }

        if (r.ok) {
          const data: ApiAIChatResponse = await r.json();
          setMessages(prev => [
            ...prev.filter(m => m.id !== optimisticId),
            toMessage(data.user_message, user.id),
            toMessage(data.ai_message, user.id),
          ]);

          if (activeConv.id === -1) {
            const convRes = await fetch('/api/backend/messages/conversations');
            if (convRes.ok) {
              const convData: ApiConversation[] = await convRes.json();
              const convs = convData.map(toConversation);
              setConversations(convs);
              const realAiConv = convs.find(c => c.isAI);
              if (realAiConv) setActiveConv(realAiConv);
            }
          } else {
            const preview = data.ai_message.text?.slice(0, 60) ?? '';
            setConversations(prev => {
              const updated = prev.map(c => c.id === activeConv.id ? { ...c, preview, time: now } : c);
              return [...updated.filter(c => c.id === activeConv.id), ...updated.filter(c => c.id !== activeConv.id)];
            });
          }
        }
      } else {
        const r = await fetch(`/api/backend/messages/conversations/${activeConv.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (r.ok) {
          const msg: ApiMessage = await r.json();
          setMessages(prev => [...prev, toMessage(msg, user.id)]);
          newEmptyConvRef.current = null;
          const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          setConversations(prev => {
            const updated = prev.map(c => c.id === activeConv.id ? { ...c, preview: `Vous : ${text}`, time: now } : c);
            return [...updated.filter(c => c.id === activeConv.id), ...updated.filter(c => c.id !== activeConv.id)];
          });
        }
      }
    } finally {
      setSending(false);
      setAiTyping(false);
    }
  };

  /* ── Vue conversation ── */
  if (activeConv) {
    return (
      <>
        <div className="fixed inset-x-0 bottom-0 z-30 bg-surface flex flex-col" style={{ top: '56px' }}>

          <div className="shrink-0 bg-surface border-b border-outline-variant px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={backToList}
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

              {aiTyping && (
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs text-white">✦</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="h-4" />
              <div ref={messagesEndRef} />
            </div>
          </div>

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

        {showMembers && (
          <div
            className={`fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${membersVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeMembers}
          />
        )}

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
        {/* Modale création */}
        {createMode && (
          <>
            <div
              className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${createVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={closeCreate}
            />
            <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none pb-4 px-3">
              <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 bg-outline-variant rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant shrink-0">
                  <p className="text-lg font-bold text-on-surface">
                    {createMode === 'group' ? 'Nouveau groupe' : 'Nouvelle conversation'}
                  </p>
                  <button onClick={closeCreate} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                    <X size={18} className="text-on-surface-variant" />
                  </button>
                </div>

                {/* Nom du groupe */}
                {createMode === 'group' && (
                  <div className="px-5 py-3 border-b border-outline-variant shrink-0">
                    <input
                      type="text"
                      placeholder="Nom du groupe (optionnel)"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                )}

                {/* Onglets */}
                <div className="flex mx-5 mt-3 mb-1 bg-surface-container rounded-xl p-1 gap-1 shrink-0">
                  {(['joueurs', 'staff', 'coachs'] as CreateTab[]).map(tab => {
                    const base = tab === 'joueurs' ? (usersGrouped?.players ?? [])
                      : tab === 'staff' ? (usersGrouped?.staff ?? [])
                      :                   (usersGrouped?.coaches ?? []);
                    const count = createSearch
                      ? base.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(createSearch.toLowerCase()) || (u.role ?? '').toLowerCase().includes(createSearch.toLowerCase())).length
                      : base.length;
                    return (
                      <button key={tab} onClick={() => setCreateTab(tab)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex items-center justify-center gap-1 ${createTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'}`}>
                        {tab}
                        {count > 0 && <span className="text-xs text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Recherche */}
                <div className="px-5 py-3 border-b border-outline-variant shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={15} />
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={createSearch}
                      onChange={e => setCreateSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    {createSearch && (
                      <button
                        onClick={() => setCreateSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-outline/20 transition-colors"
                      >
                        <X size={12} className="text-outline" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {!usersGrouped ? (
                    <div className="p-6 text-center text-sm text-on-surface-variant">Chargement…</div>
                  ) : (() => {
                    const raw = createTab === 'joueurs' ? usersGrouped.players
                      : createTab === 'staff'   ? usersGrouped.staff
                      :                           usersGrouped.coaches;
                    const list = createSearch
                      ? raw.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(createSearch.toLowerCase()) || (u.role ?? '').toLowerCase().includes(createSearch.toLowerCase()))
                      : raw;
                    if (list.length === 0)
                      return <div className="p-6 text-center text-sm text-on-surface-variant">{createSearch ? 'Aucun résultat' : 'Aucun membre dans cette catégorie'}</div>;
                    return list.map(u => {
                      const rt = userRoleType(u);
                      const initials = `${u.first_name[0]}${u.last_name[0]}`;
                      const isChecked = groupSelected.has(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => createMode === 'group' ? toggleGroupUser(u.id) : startConversationWith(u.id)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-surface-container'}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                            <span className="font-bold text-sm text-on-surface-variant">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${nameColor(rt)}`}>{u.first_name} {u.last_name}</p>
                            {u.role && <p className="text-xs text-on-surface-variant truncate">{u.role}</p>}
                          </div>
                          {createMode === 'group' ? (
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                              {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                          ) : (
                            <ChevronRight size={16} className="text-outline shrink-0" />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Footer groupe */}
                {createMode === 'group' && (
                  <div className="px-5 py-4 border-t border-outline-variant shrink-0">
                    <button
                      onClick={createGroup}
                      disabled={groupSelected.size < 2 || creatingConv}
                      className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
                    >
                      Créer le groupe{groupSelected.size >= 2 ? ` (${groupSelected.size} membres)` : ''}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </>
        )}
      </>
    );
  }

  /* ── Vue liste ── */
  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Messages</h1>
        <div className="relative">
          <button
            onClick={() => setPlusOpen(v => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <Plus size={20} className="text-on-surface-variant" />
          </button>
          {plusOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => openCreateMode('conversation')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                <MessageSquare size={16} className="text-primary shrink-0" />
                Conversation
              </button>
              <button
                onClick={() => openCreateMode('group')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                <Users size={16} className="text-secondary shrink-0" />
                Groupe
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input type="text" placeholder={t.messaging.searchPlaceholder}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-outline/20 active:bg-outline/30 transition-colors"
          >
            <X size={15} className="text-outline" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
        {(['Tous', 'Team', 'Staff'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-base font-semibold transition-all ${activeTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab === 'Tous' ? t.messaging.tabAll : tab === 'Team' ? t.messaging.tabTeam : t.messaging.tabStaff}
          </button>
        ))}
      </div>

      <div onClick={() => openConv(displayAiConv)}
        className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-all bg-primary/5 border border-primary/20 border-l-4 border-l-primary">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold">✦</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-base font-bold text-primary">{displayAiConv.name}</p>
          </div>
          <p className={`text-sm truncate ${displayAiConv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{displayAiConv.preview}</p>
        </div>
        {displayAiConv.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.messaging.teamAndStaff}</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

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
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {conv.unread && <div className={`w-2.5 h-2.5 rounded-full ${conv.isGroup ? 'bg-primary' : (accent?.dot ?? 'bg-primary')}`} />}
                    <span className="text-xs text-on-surface-variant">{conv.time}</span>
                    <button
                      onClick={e => hideConversation(conv.id, e)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-error/10 active:bg-error/20 transition-colors ml-1"
                      title="Supprimer la conversation"
                    >
                      <X size={14} className="text-outline" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{conv.preview}</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
