'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar,
  Package, Shield,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendar', href: '/calendrier', icon: Calendar },
  { label: 'Players', href: '/joueurs', icon: Users },
  { label: 'Logistics', href: '/logistique', icon: Package },
  { label: 'Admin', href: '/administration', icon: Shield },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-inverse-surface border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-primary' : 'hover:bg-white/10'
              }`}>
                <Icon
                  size={22}
                  className={isActive ? 'text-white' : 'text-white/60'}
                />
              </div>
              <span className={`text-xs font-semibold ${
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