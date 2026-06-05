'use client';

import Image from 'next/image';
import { Bell, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileHeader() {
  const { user } = useAuth();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '?';

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
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
      </div>
    </div>
  );
}
