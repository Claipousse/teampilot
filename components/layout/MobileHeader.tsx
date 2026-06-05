'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '?';

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  return (
    <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-surface-container-lowest border-b border-outline-variant shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Image src="/logo-icon.png" alt="TeamPilot" width={24} height={24} />
        </div>
        <span className="text-base font-bold text-primary">TeamPilot</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
          <Bell size={20} className="text-on-surface-variant" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
          <Settings size={20} className="text-on-surface-variant" />
        </button>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0"
          >
            <span className="text-white text-sm font-bold">{initials}</span>
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 min-w-[180px]">
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
    </div>
  );
}
