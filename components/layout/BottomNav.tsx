'use client';

//Barre navigation pour version mobile, en bas de l'écran
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, Package, User } from 'lucide-react';

const navItems = [
  { label: 'Club', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendrier', href: '/calendrier', icon: Calendar },
  { label: 'Joueurs', href: '/joueurs', icon: Users },
  { label: 'Logistique', href: '/logistique', icon: Package },
  { label: 'Profil', href: '/administration', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glass border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}>
                <Icon size={22} className={isActive ? 'text-white' : 'text-white/60'} />
              </div>
              <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/50'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}