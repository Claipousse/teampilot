'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, X, LogOut, KeyRound } from 'lucide-react';
import { useLanguage, useT } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

type NotifKind = 'added' | 'rescheduled' | 'cancelled' | 'message';

type NotifEvent = {
  id: number;
  kind: NotifKind;
  title: string;
  tag: string | null;
  event_id: number | null;
  event_date: string | null;
  created_at: string;
};

function evtDotClass(tag: string | null): string {
  if (tag === 'Match')        return 'bg-error';
  if (tag === 'Entraînement') return 'bg-primary';
  if (tag === 'Récupération') return 'bg-secondary';
  if (tag === 'Réunion')      return 'bg-outline';
  return 'bg-outline';
}

function msgDotClass(tag: string | null): string {
  if (tag === 'coach')  return 'bg-primary';
  if (tag === 'player') return 'bg-secondary';
  return 'bg-[#F97316]'; // staff
}

type PlayerResult = { id: number; first_name: string; last_name: string; shirt_number: number; position: string; position_short: string; nationality_flag?: string };
type EventResult  = { id: number; title: string; tag: string; event_date: string };
type ConvoResult  = { id: number; name: string; category: string };

function evtTagColor(tag: string): string {
  if (tag === 'Match')        return 'bg-error';
  if (tag === 'Entraînement') return 'bg-primary';
  if (tag === 'Récupération') return 'bg-secondary';
  return 'bg-outline';
}

function fmtNotifTime(createdAt: string): string {
  const dt = new Date(createdAt);
  const diffMs = Date.now() - dt.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "À l'instant";
  if (diffH < 1) return `Il y a ${diffM} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD}j`;
}

const MAX_VISIBLE = 3;

export default function Header() {
  const [query,          setQuery]          = useState('');
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchPlayers,  setSearchPlayers]  = useState<PlayerResult[]>([]);
  const [searchEvents,   setSearchEvents]   = useState<EventResult[]>([]);
  const [searchConvos,   setSearchConvos]   = useState<ConvoResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifTab,    setNotifTab]    = useState<'events' | 'messages'>('events');
  const [profileOpen, setProfileOpen] = useState(false);

  const { lang, setLang } = useLanguage();
  const t = useT();
  const { user, logout } = useAuth();

  const router = useRouter();

  const fullName = user ? `${user.firstName} ${user.lastName}` : '—';
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '?';
  const roleLabel = user?.isAdmin ? 'Admin' : user?.type === 'staff' ? 'Staff' : 'Joueur';

  const [events, setEvents] = useState<NotifEvent[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/backend/notifications')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: NotifEvent[]) => setEvents(data))
      .catch(err => console.warn('[notifications] fetch failed:', err));
  }, [user?.id]);

  useEffect(() => {
    if (query.length < 2) {
      setSearchPlayers([]); setSearchEvents([]); setSearchConvos([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const q = query.toLowerCase();
      try {
        const [pRes, eRes, mRes] = await Promise.all([
          fetch('/api/backend/players'),
          fetch('/api/backend/events'),
          fetch('/api/backend/messages/conversations'),
        ]);
        if (pRes.ok) {
          const all: PlayerResult[] = await pRes.json();
          setSearchPlayers(all.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)).slice(0, 6));
        }
        if (eRes.ok) {
          const all: EventResult[] = await eRes.json();
          setSearchEvents(all.filter(e => e.title.toLowerCase().includes(q)).slice(0, 6));
        }
        if (mRes.ok) {
          const all: ConvoResult[] = await mRes.json();
          setSearchConvos(all.filter(c => c.name.toLowerCase().includes(q)).slice(0, 6));
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchRef  = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchOpen(false);
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setLangOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const removeEvent = async (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/backend/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const openEventNotif = (n: NotifEvent) => {
    removeEvent(n.id);
    setNotifOpen(false);
    if (n.event_id) {
      router.push(`/calendrier?eventId=${n.event_id}`);
    }
  };

  const evtNotifs = events.filter(n => n.kind !== 'message');
  const msgNotifs = events.filter(n => n.kind === 'message');
  const totalUnread = events.length;
  const visibleEvents = evtNotifs.slice(0, MAX_VISIBLE);
  const visibleMessages = msgNotifs.slice(0, MAX_VISIBLE);

  const hasSearchResults = searchPlayers.length > 0 || searchEvents.length > 0 || searchConvos.length > 0;

  return (
    <header className="h-22 bg-surface-container-lowest border-b border-outline-variant flex items-center px-8 gap-4 shrink-0 relative z-30">

      {/* Recherche avec catégories */}
      <div ref={searchRef} className="flex-1 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none" size={20} />
        <input
          type="text"
          placeholder="Rechercher joueurs, événements, messages…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          className={`w-full pl-12 pr-4 py-3 bg-surface-container text-base text-on-surface placeholder:text-outline border border-outline-variant outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${searchOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
        />
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-surface-container-lowest border border-outline-variant border-t-0 rounded-b-xl shadow-xl z-50 overflow-hidden max-h-[480px] overflow-y-auto">
            {query.length < 2 ? (
              <p className="px-4 py-4 text-sm text-center text-on-surface-variant/60">Tapez au moins 2 caractères pour rechercher</p>
            ) : searchLoading ? (
              <p className="px-4 py-4 text-sm text-center text-on-surface-variant/60">Recherche…</p>
            ) : !hasSearchResults ? (
              <p className="px-4 py-4 text-sm text-center text-on-surface-variant">Aucun résultat pour &ldquo;{query}&rdquo;</p>
            ) : (
              <>
                {/* Joueurs */}
                {searchPlayers.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container/60 border-b border-outline-variant/50">Joueurs</div>
                    {searchPlayers.map(p => (
                      <button key={p.id} onClick={() => { router.push('/joueurs'); setSearchOpen(false); setQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left">
                        <span className="px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary rounded-lg shrink-0">{p.position_short || '?'}</span>
                        <span className="text-sm font-semibold text-on-surface">{p.first_name} {p.last_name}</span>
                        <span className="text-xs text-on-surface-variant ml-auto shrink-0">#{p.shirt_number}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Événements */}
                {searchEvents.length > 0 && (
                  <>
                    <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container/60 border-b border-outline-variant/50 ${searchPlayers.length > 0 ? 'border-t border-outline-variant/50' : ''}`}>Événements</div>
                    {searchEvents.map(e => (
                      <button key={e.id} onClick={() => { router.push(`/calendrier?eventId=${e.id}`); setSearchOpen(false); setQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${evtTagColor(e.tag)}`} />
                        <span className="text-sm font-semibold text-on-surface">{e.title}</span>
                        <span className="text-xs text-on-surface-variant ml-auto shrink-0">{e.event_date ? new Date(e.event_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Messages */}
                {searchConvos.length > 0 && (
                  <>
                    <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container/60 border-b border-outline-variant/50 ${(searchPlayers.length > 0 || searchEvents.length > 0) ? 'border-t border-outline-variant/50' : ''}`}>Messages</div>
                    {searchConvos.map(c => (
                      <button key={c.id} onClick={() => { router.push('/messagerie'); setSearchOpen(false); setQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left">
                        <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Search size={13} className="text-primary" />
                        </span>
                        <span className="text-sm font-semibold text-on-surface">{c.name}</span>
                        <span className="text-xs text-on-surface-variant ml-auto shrink-0 capitalize">{c.category}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Droite */}
      <div className="flex items-center ml-auto gap-1">

        {/* Langue */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => { setLangOpen(v => !v); setNotifOpen(false); }}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
            title="Langue">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lang === 'fr' ? 'https://flagcdn.com/w40/fr.png' : 'https://flagcdn.com/w40/gb.png'} alt={lang === 'fr' ? 'FR' : 'EN'} width={28} height={21} className="rounded-sm object-cover" />
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 min-w-[148px]">
              {(['fr', 'en'] as const).map((l, i) => (
                <button key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-surface-container transition-colors ${i > 0 ? 'border-t border-outline-variant' : ''} ${lang === l ? 'text-primary bg-primary/5' : 'text-on-surface'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l === 'fr' ? 'https://flagcdn.com/w40/fr.png' : 'https://flagcdn.com/w40/gb.png'} alt={l === 'fr' ? 'FR' : 'EN'} width={24} height={18} className="rounded-sm object-cover shrink-0" />
                  {l === 'fr' ? t.header.langFr : t.header.langEn}
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
                <p className="text-base font-bold text-on-surface">{t.header.notifications}</p>
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
                  {t.header.notifEvents}
                  {evtNotifs.length > 0 && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{evtNotifs.length}</span>}
                </button>
                <button onClick={() => setNotifTab('messages')}
                  className={`flex-1 py-2.5 text-sm font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
                    notifTab === 'messages' ? 'text-primary border-primary bg-primary/5' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'
                  }`}>
                  {t.header.notifMessages}
                  {msgNotifs.length > 0 && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{msgNotifs.length}</span>}
                </button>
              </div>

              <div className="divide-y divide-outline-variant/50">
                {notifTab === 'events' ? (
                  events.length === 0 ? (
                    <p className="py-8 text-center text-sm text-on-surface-variant">{t.header.noNotifications}</p>
                  ) : (
                    <>
                      {visibleEvents.map(n => (
                        <div key={n.id} onClick={() => openEventNotif(n)}
                          className="group/item relative flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container transition-colors cursor-pointer">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${evtDotClass(n.tag)}`} />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{fmtNotifTime(n.created_at)}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeEvent(n.id); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {events.length > MAX_VISIBLE && (
                        <button onClick={() => { setNotifOpen(false); router.push('/calendrier'); }}
                          className="w-full flex items-center justify-center px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                          {t.header.seeMore} ({events.length - MAX_VISIBLE} {t.header.moreSuffix}) →
                        </button>
                      )}
                    </>
                  )
                ) : msgNotifs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">{t.header.noMessages}</p>
                ) : (
                  <>
                    {visibleMessages.map(n => (
                      <div key={n.id} onClick={() => { removeEvent(n.id); setNotifOpen(false); router.push('/messagerie'); }}
                        className="group/item relative flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container transition-colors cursor-pointer">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${msgDotClass(n.tag)}`} />
                        <div className="flex-1 min-w-0 pr-6">
                          <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{fmtNotifTime(n.created_at)}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); removeEvent(n.id); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {msgNotifs.length > MAX_VISIBLE && (
                      <button onClick={() => { setNotifOpen(false); router.push('/messagerie'); }}
                        className="w-full flex items-center justify-center px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                        {t.header.seeMore} ({msgNotifs.length - MAX_VISIBLE} {t.header.moreSuffix}) →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-outline-variant mx-4" />

        {/* Profil */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(v => !v); setLangOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-4 rounded-xl hover:bg-surface-container px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-lg font-bold text-on-surface leading-tight">{fullName}</p>
              <p className="text-sm text-primary uppercase tracking-widest font-semibold">{roleLabel}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-base font-bold">{initials}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 min-w-[230px]">
              <button
                onClick={() => { setProfileOpen(false); router.push('/change-password'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors whitespace-nowrap"
              >
                <KeyRound size={15} className="text-on-surface-variant shrink-0" />
                Changer le mot de passe
              </button>
              <div className="border-t border-outline-variant" />
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-error/5 transition-colors"
              >
                <LogOut size={15} />
                Se déconnecter
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
