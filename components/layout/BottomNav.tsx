'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users,
  MessageSquare, Package, Shield,
} from 'lucide-react';

const navItems = [
  { label: 'Club', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendrier', href: '/calendrier', icon: Calendar },
  { label: 'Joueurs', href: '/joueurs', icon: Users },
  { label: 'Messages', href: '/messagerie', icon: MessageSquare },
  { label: 'Admin', href: '/administration', icon: Shield },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-inverse-surface border-t border-white/10 px-1 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
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