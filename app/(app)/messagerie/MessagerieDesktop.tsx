'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Send, Download, FileText, Users, X, Plus, MessageSquare, ChevronRight, Check } from 'lucide-react';
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

  // Create modal
  const [createMode,     setCreateMode]     = useState<CreateMode>(null);
  const [createVisible,  setCreateVisible]  = useState(false);
  const [createTab,      setCreateTab]      = useState<CreateTab>('joueurs');
  const [createSearch,   setCreateSearch]   = useState('');
  const [plusOpen,       setPlusOpen]       = useState(false);
  const [usersGrouped,   setUsersGrouped]   = useState<ApiUsersGrouped | null>(null);
  const [groupSelected,  setGroupSelected]  = useState<Set<number>>(new Set());
  const [groupName,      setGroupName]      = useState('');
  const [creatingConv,   setCreatingConv]   = useState(false);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const plusRef         = useRef<HTMLDivElement>(null);
  const newEmptyConvRef = useRef<number | null>(null);

  const aiConv    = useMemo(() => conversations.find(c => c.isAI),    [conversations]);
  const otherConvs = useMemo(() => conversations.filter(c => !c.isAI), [conversations]);

  const filtered = useMemo(() => otherConvs.filter(conv => {
    const matchTab    = activeTab === 'Tous' || conv.category === activeTab.toLowerCase();
    const matchSearch = search === '' ||
      conv.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.preview.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [otherConvs, activeTab, search]);

  // Fermer le dropdown "+" au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) setPlusOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    window.dispatchEvent(new CustomEvent('dismiss-message-notifs', { detail: { convName: activeConv.name } }));
  }, [activeConv?.id, user?.id]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => { messagesEndRef.current?.scrollIntoView(); }, [messages]);

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
    if (!activeConv || !user) return;
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

  // Nettoyage conversation vide en quittant
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

  const selectConv = async (conv: Conversation) => {
    if (activeConv?.id === conv.id) return;
    await cleanupEmptyConv();
    setActiveConv(conv);
    setCreateMode(null);
    if (!conv.isGroup) { setShowMembers(false); setMembersVisible(false); }
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
      // Si conversation déjà existante, juste l'activer
      const existing = conversations.find(c => c.id === conv.id);
      if (existing) {
        closeCreate();
        setActiveConv(existing);
      } else {
        newEmptyConvRef.current = conv.id;
        setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)]);
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
    if (activeConv?.id === convId) setActiveConv(null);
  };

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
        newEmptyConvRef.current = null;
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setConversations(prev => {
          const updated = prev.map(c => c.id === activeConv.id ? { ...c, preview: `Vous : ${text}`, time: now } : c);
          return [...updated.filter(c => c.id === activeConv.id), ...updated.filter(c => c.id !== activeConv.id)];
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">

      {/* ── Liste ── */}
      <div className="w-80 shrink-0 border-r border-outline-variant flex flex-col">

        <div className="px-5 py-5 border-b border-outline-variant shrink-0 flex items-center justify-between">
          <p className="text-2xl font-bold text-on-surface">{t.messaging.inbox}</p>
          <div ref={plusRef} className="relative">
            <button
              onClick={() => setPlusOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
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

        <div className="px-4 py-3 border-b border-outline-variant shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
            <input type="text" placeholder={t.messaging.searchPlaceholder} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-outline/20 transition-colors"
              >
                <X size={13} className="text-outline" />
              </button>
            )}
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

        <div className="flex items-center gap-3 px-4 py-2 shrink-0">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.messaging.teamAndStaff}</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-on-surface-variant">{t.messaging.noConversation}</div>
          ) : filtered.map(conv => {
            const accent = conv.isGroup ? null : roleAccent(conv.roleType as string);
            return (
              <div key={conv.id} onClick={() => selectConv(conv)}
                className={`group flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 ${
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
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {conv.unread && <div className={`w-2.5 h-2.5 rounded-full ${conv.isGroup ? 'bg-primary' : (accent?.dot ?? 'bg-primary')}`} />}
                      <span className="text-xs text-on-surface-variant group-hover:hidden">{conv.time}</span>
                      <button
                        onClick={e => hideConversation(conv.id, e)}
                        className="hidden group-hover:flex w-6 h-6 items-center justify-center rounded-full hover:bg-error/10 transition-colors"
                        title="Supprimer la conversation"
                      >
                        <X size={13} className="text-on-surface-variant hover:text-error" />
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

      {/* ── Modale création conversation / groupe ── */}
      {createMode && (
        <>
          <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${createVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeCreate}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">
                  {createMode === 'group' ? 'Nouveau groupe' : 'Nouvelle conversation'}
                </p>
                <button onClick={closeCreate} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Nom du groupe */}
              {createMode === 'group' && (
                <div className="px-6 py-4 border-b border-outline-variant shrink-0">
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
              <div className="flex mx-6 mt-4 mb-1 bg-surface-container rounded-xl p-1 gap-1 shrink-0">
                {(['joueurs', 'staff', 'coachs'] as CreateTab[]).map(tab => {
                  const base = tab === 'joueurs' ? (usersGrouped?.players ?? [])
                    : tab === 'staff' ? (usersGrouped?.staff ?? [])
                    :                   (usersGrouped?.coaches ?? []);
                  const count = createSearch
                    ? base.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(createSearch.toLowerCase()) || (u.role ?? '').toLowerCase().includes(createSearch.toLowerCase())).length
                    : base.length;
                  return (
                    <button key={tab} onClick={() => setCreateTab(tab)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${createTab === tab ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      {tab}
                      {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${createTab === tab ? 'bg-surface-container text-on-surface-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Recherche */}
              <div className="px-6 py-3 border-b border-outline-variant shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={15} />
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    value={createSearch}
                    onChange={e => setCreateSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
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
                <div className="px-6 py-4 border-t border-outline-variant shrink-0">
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

    </div>
  );
}
