'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar,
  MessageSquare, Shield,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT } from '@/contexts/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';
  const t = useT();

  const navItems = [
    { label: t.nav.dashboard,      href: '/dashboard',     icon: LayoutDashboard, adminOnly: false },
    { label: t.nav.players,        href: '/joueurs',        icon: Users,           adminOnly: false },
    { label: t.nav.calendar,       href: '/calendrier',     icon: Calendar,        adminOnly: false },
    { label: t.nav.messaging,      href: '/messagerie',     icon: MessageSquare,   adminOnly: false },
    { label: t.nav.administration, href: '/administration', icon: Shield,          adminOnly: true  },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-[200px] xl:w-[260px] 2xl:w-[280px] h-screen bg-inverse-surface flex flex-col shrink-0 transition-all">

      {/* Logo */}
      <div className="px-4 xl:px-6 py-4 xl:py-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 xl:gap-4">
          <div className="w-11 h-11 xl:w-13 xl:h-13 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Image src="/logo-icon.png" alt="TeamPilot" width={30} height={30} />
          </div>
          <p className="text-white font-bold text-base xl:text-xl leading-tight">TeamPilot</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 xl:px-4 py-4 xl:py-6 space-y-1 xl:space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.adminOnly) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 xl:gap-4 px-3 xl:px-5 py-3 xl:py-4 rounded-xl transition-all text-base xl:text-lg font-semibold ${
                  isActive
                    ? 'bg-red-900/80 text-red-200'
                    : 'text-red-400/70 hover:text-red-300 hover:bg-red-500/10'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 xl:gap-4 px-3 xl:px-5 py-3 xl:py-4 rounded-xl transition-all text-base xl:text-lg font-semibold ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}