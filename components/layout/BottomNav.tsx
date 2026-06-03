'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users,
  MessageSquare, Shield,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT } from '@/contexts/LanguageContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';
  const t = useT();

  const navItems = [
    { label: t.nav.club,       href: '/dashboard',     icon: LayoutDashboard, adminOnly: false },
    { label: t.nav.calendar,   href: '/calendrier',    icon: Calendar,        adminOnly: false },
    { label: t.nav.players,    href: '/joueurs',        icon: Users,           adminOnly: false },
    { label: t.nav.messaging,  href: '/messagerie',     icon: MessageSquare,   adminOnly: false },
    { label: t.nav.adminShort, href: '/administration', icon: Shield,          adminOnly: true  },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-inverse-surface border-t border-white/10 px-1 py-2 flex items-center justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.adminOnly) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-1 py-1"
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  isActive ? 'bg-red-900/80' : 'hover:bg-red-500/10'
                }`}>
                  <Icon size={20} className={isActive ? 'text-white' : 'text-red-400/70'} />
                </div>
                <span className={`text-[10px] font-semibold ${
                  isActive ? 'text-red-200' : 'text-red-400/60'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-1 py-1"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-primary' : 'hover:bg-white/10'
              }`}>
                <Icon size={20} className={isActive ? 'text-white' : 'text-white/60'} />
              </div>
              <span className={`text-[10px] font-semibold ${
                isActive ? 'text-white' : 'text-white/50'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}