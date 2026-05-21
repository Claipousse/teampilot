'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Trophy,
  BrainCircuit,
  MessageSquare,
  Package,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Players', href: '/joueurs', icon: Users },
  { label: 'Training', href: '/calendrier', icon: Dumbbell },
  { label: 'AI Analytics', href: '/ia-analytics', icon: BrainCircuit },
  { label: 'Communication', href: '/messagerie', icon: MessageSquare },
  { label: 'Logistics', href: '/logistique', icon: Package },
];

const bottomItems = [
  { label: 'Settings', href: '/administration', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-inverse-surface flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Image src="/logo-icon.png" alt="TeamPilot" width={28} height={28} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">TeamPilot AI</p>
            <p className="text-white/60 text-2xs tracking-wide">Elite Tactical Control</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base font-medium ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Generate Report */}
      <div className="px-3 pb-4">
        <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-container text-white text-base font-semibold rounded-xl transition-all">
          <Zap size={18} />
          Generate Report
        </button>
      </div>

      <div className="border-t border-white/10 mx-3" />

      {/* Settings + Support */}
      <nav className="px-3 py-3 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base font-medium ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profil */}
      <div className="px-3 pb-5 pt-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">AG</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-base font-semibold truncate">Alex Graham</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Head Coach</p>
          </div>
        </div>
      </div>

    </aside>
  );
}