'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, KeyRound, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useT } from '@/contexts/LanguageContext';
import { useNotifications, evtDotClass, msgDotClass, fmtNotifTime } from '@/hooks/useNotifications';

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const router = useRouter();

  const initials  = user ? `${user.firstName[0]}${user.lastName[0]}` : '?';
  const fullName  = user ? `${user.firstName} ${user.lastName}` : '—';
  const roleLabel = user?.isAdmin ? 'Admin' : user?.type === 'staff' ? 'Staff' : t.profile.rolePlayer;

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifTab,    setNotifTab]    = useState<'events' | 'messages'>('events');

  const { evtNotifs, msgNotifs, totalUnread, remove } = useNotifications();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  return (
    <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-surface-container-lowest border-b border-outline-variant shrink-0 relative z-40">

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Image src="/logo-icon.png" alt="Teampilot AI" width={24} height={24} />
        </div>
        <span className="text-base font-bold text-primary">Teampilot AI</span>
      </div>

      <div className="flex items-center gap-3">

        {/* Toggle langue (bascule directement sans dropdown) */}
        <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
          title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lang === 'fr' ? 'https://flagcdn.com/w40/fr.png' : 'https://flagcdn.com/w40/gb.png'} alt={lang === 'fr' ? 'FR' : 'EN'} width={26} height={20} className="rounded-sm object-cover" />
        </button>

        {/* Cloche notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
            <Bell size={20} className="text-on-surface-variant" />
            {totalUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2.5rem)] max-w-sm bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-bold text-on-surface">{t.header.notifications}</p>
                <button onClick={() => setNotifOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-surface-container">
                  <X size={14} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex border-b border-outline-variant">
                {(['events', 'messages'] as const).map(tab => {
                  const count = tab === 'events' ? evtNotifs.length : msgNotifs.length;
                  return (
                    <button key={tab} onClick={() => setNotifTab(tab)}
                      className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${notifTab === tab ? 'text-primary border-primary bg-primary/5' : 'text-on-surface-variant border-transparent'}`}>
                      {tab === 'events' ? t.header.notifEvents : t.header.notifMessages}
                      {count > 0 && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/50">
                {notifTab === 'events' ? (
                  evtNotifs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-on-surface-variant">{t.header.noNotifications}</p>
                  ) : evtNotifs.map(n => (
                    <div key={n.id}
                      onClick={() => { remove(n.id); setNotifOpen(false); if (n.event_id) router.push(`/calendrier?eventId=${n.event_id}`); }}
                      className="group/item relative flex items-start gap-3 px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer active:bg-surface-container">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${evtDotClass(n.tag)}`} />
                      <div className="flex-1 min-w-0 pr-5">
                        <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{fmtNotifTime(n.created_at)}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); remove(n.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))
                ) : msgNotifs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-on-surface-variant">{t.header.noMessages}</p>
                ) : msgNotifs.map(n => (
                  <div key={n.id}
                    onClick={() => { remove(n.id); setNotifOpen(false); router.push('/messagerie'); }}
                    className="group/item relative flex items-start gap-3 px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer active:bg-surface-container">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${msgDotClass(n.tag)}`} />
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{fmtNotifTime(n.created_at)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); remove(n.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar / menu profil */}
        <div ref={profileRef} className="relative">
          <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-bold text-on-surface">{fullName}</p>
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mt-0.5">{roleLabel}</p>
              </div>
              <button onClick={() => { setProfileOpen(false); router.push('/change-password'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors whitespace-nowrap">
                <KeyRound size={15} className="text-on-surface-variant shrink-0" />
                {t.profile.changePassword}
              </button>
              <div className="border-t border-outline-variant" />
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-error/5 transition-colors">
                <LogOut size={15} className="shrink-0" />
                {t.profile.logout}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
