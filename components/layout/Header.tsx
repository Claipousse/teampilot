'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';

type SearchTab = 'Joueurs' | 'Événements' | 'Messages';
type Lang = 'FR' | 'EN';
type NotifKind = 'added' | 'rescheduled' | 'cancelled';

type NotifEvent = {
  id: number;
  title: string;
  time: string;
  kind: NotifKind;
  eventDate: string; // YYYY-MM-DD — auto-removed if in the past
};

type NotifMessage = {
  id: number;
  from: string;
  preview: string;
  time: string;
  unread: number;
};

const SEARCH_TABS: SearchTab[] = ['Joueurs', 'Événements', 'Messages'];

// eventDate >= 2026-06-03 (today) → kept ; < → auto-removed
const INITIAL_EVENTS: NotifEvent[] = [
  { id: 1, title: 'Match vs Arsenal ajouté',           time: 'Il y a 2h', kind: 'added',       eventDate: '2026-06-15' },
  { id: 2, title: 'Entraînement reprogrammé au 12/06', time: 'Il y a 5h', kind: 'rescheduled', eventDate: '2026-06-12' },
  { id: 3, title: 'Match vs Chelsea annulé',            time: 'Hier',     kind: 'cancelled',   eventDate: '2026-06-01' }, // passé → auto-supprimé
  { id: 4, title: 'Réunion staff planifiée',            time: 'Il y a 1j', kind: 'added',      eventDate: '2026-06-20' },
  { id: 5, title: 'Match amical vs Brighton',           time: 'Il y a 2j', kind: 'added',      eventDate: '2026-05-28' }, // passé → auto-supprimé
];

const INITIAL_MESSAGES: NotifMessage[] = [
  { id: 1, from: 'Marcus V.',  preview: 'Bonjour coach, je voulais vous dire...', time: 'Il y a 1h', unread: 2 },
  { id: 2, from: 'Stefan K.',  preview: 'OK pour demain, je serai là.',            time: 'Il y a 3h', unread: 1 },
  { id: 3, from: 'Kevin L.',   preview: 'Concernant le match de samedi…',          time: 'Il y a 4h', unread: 3 },
  { id: 4, from: 'Alex M.',    preview: 'Est-ce qu\'on s\'entraîne lundi ?',       time: 'Il y a 6h', unread: 1 },
];

const MAX_VISIBLE = 3;

export default function Header() {
  const [searchTab,   setSearchTab]   = useState<SearchTab>('Joueurs');
  const [query,       setQuery]       = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [lang,        setLang]        = useState<Lang>('FR');
  const [langOpen,    setLangOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifTab,    setNotifTab]    = useState<'events' | 'messages'>('events');

  // Notifications en état pour pouvoir les supprimer
  const [events, setEvents] = useState<NotifEvent[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return INITIAL_EVENTS.filter(e => new Date(e.eventDate) >= today);
  });
  const [messages, setMessages] = useState<NotifMessage[]>(INITIAL_MESSAGES);

  const searchRef = useRef<HTMLDivElement>(null);
  const langRef   = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (langRef.current   && !langRef.current.contains(e.target as Node))   setLangOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const removeEvent   = (id: number) => setEvents(prev => prev.filter(e => e.id !== id));
  const removeMessage = (id: number) => setMessages(prev => prev.filter(m => m.id !== id));

  const msgUnread   = messages.reduce((s, m) => s + m.unread, 0);
  const totalUnread = events.length + msgUnread;

  const visibleEvents   = events.slice(0, MAX_VISIBLE);
  const visibleMessages = messages.slice(0, MAX_VISIBLE);

  return (
    <header className="h-22 bg-surface-container-lowest border-b border-outline-variant flex items-center px-8 gap-4 shrink-0 relative z-30">

      {/* Recherche avec catégories */}
      <div ref={searchRef} className="flex-1 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none" size={20} />
        <input
          type="text"
          placeholder={`Rechercher ${searchTab === 'Joueurs' ? 'un joueur…' : searchTab === 'Événements' ? 'un événement…' : 'une conversation…'}`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          className={`w-full pl-12 pr-4 py-3 bg-surface-container text-base text-on-surface placeholder:text-outline border border-outline-variant outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${searchOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
        />
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-surface-container-lowest border border-outline-variant border-t-0 rounded-b-xl shadow-xl z-50 overflow-hidden">
            <div className="flex">
              {SEARCH_TABS.map(tab => (
                <button key={tab} onClick={() => { setSearchTab(tab); setQuery(''); }}
                  className={`flex-1 py-2.5 text-sm font-bold transition-colors border-b-2 ${
                    searchTab === tab
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 text-sm text-center min-h-[52px] flex items-center justify-center">
              {query
                ? <span className="text-on-surface-variant">Recherche de <strong className="text-on-surface">&ldquo;{query}&rdquo;</strong> dans les {searchTab.toLowerCase()}…{/* TODO backend: connecter la recherche par catégorie */}</span>
                : <span className="text-on-surface-variant/60">Tapez pour rechercher parmi les {searchTab.toLowerCase()}</span>
              }
            </div>
          </div>
        )}
      </div>

      {/* Droite */}
      <div className="flex items-center ml-auto gap-1">

        {/* Langue */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => { setLangOpen(v => !v); setNotifOpen(false); }}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors text-2xl"
            title="Langue">
            {lang === 'FR' ? '🇫🇷' : '🇬🇧'}
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 min-w-[148px]">
              {(['FR', 'EN'] as Lang[]).map((l, i) => (
                <button key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-surface-container transition-colors ${i > 0 ? 'border-t border-outline-variant' : ''} ${lang === l ? 'text-primary bg-primary/5' : 'text-on-surface'}`}>
                  <span className="text-lg">{l === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                  {l === 'FR' ? 'Français' : 'English'}
                  {lang === l && <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setLangOpen(false); }}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
            <Bell size={26} className="text-on-surface-variant" />
            {totalUnread > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                <p className="text-base font-bold text-on-surface">Notifications</p>
                <button onClick={() => setNotifOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex border-b border-outline-variant">
                <button onClick={() => setNotifTab('events')}
                  className={`flex-1 py-2.5 text-sm font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
                    notifTab === 'events' ? 'text-primary border-primary bg-primary/5' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'
                  }`}>
                  Événements
                  {events.length > 0 && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{events.length}</span>}
                </button>
                <button onClick={() => setNotifTab('messages')}
                  className={`flex-1 py-2.5 text-sm font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
                    notifTab === 'messages' ? 'text-primary border-primary bg-primary/5' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'
                  }`}>
                  Messages
                  {msgUnread > 0 && <span className="px-1.5 py-0.5 bg-error/10 text-error text-xs font-bold rounded-full">{msgUnread}</span>}
                </button>
              </div>

              <div className="divide-y divide-outline-variant/50">
                {notifTab === 'events' ? (
                  events.length === 0 ? (
                    <p className="py-8 text-center text-sm text-on-surface-variant">Aucune notification</p>
                  ) : (
                    <>
                      {visibleEvents.map(n => (
                        <div key={n.id} className="group/item relative flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container transition-colors cursor-pointer">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                            n.kind === 'added' ? 'bg-secondary' : n.kind === 'rescheduled' ? 'bg-[#F97316]' : 'bg-error'
                          }`} />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{n.time}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeEvent(n.id); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {events.length > MAX_VISIBLE && (
                        <a href="/calendrier"
                          className="flex items-center justify-center px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                          Voir plus ({events.length - MAX_VISIBLE} de plus) →
                        </a>
                      )}
                    </>
                  )
                ) : (
                  messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-on-surface-variant">Aucun nouveau message</p>
                  ) : (
                    <>
                      {visibleMessages.map(m => (
                        <div key={m.id} className="group/item relative flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container transition-colors cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {m.from.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-on-surface">{m.from}</p>
                              <span className="px-1.5 py-0.5 bg-error/10 text-error text-xs font-bold rounded-full shrink-0">{m.unread}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant truncate">{m.preview}</p>
                            <p className="text-xs text-on-surface-variant/60 mt-0.5">{m.time}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeMessage(m.id); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {messages.length > MAX_VISIBLE && (
                        <a href="/messagerie"
                          className="flex items-center justify-center px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                          Voir plus ({messages.length - MAX_VISIBLE} de plus) →
                        </a>
                      )}
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-outline-variant mx-4" />

        {/* Profil */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-on-surface leading-tight">Alex Graham</p>
            <p className="text-sm text-primary uppercase tracking-widest font-semibold">Head Coach</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-base font-bold">AG</span>
          </div>
        </div>

      </div>
    </header>
  );
}
