'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, 
  Users, 
  Calendar,
  BrainCircuit, 
  MessageSquare, 
  Package, 
  Shield,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Players', href: '/joueurs', icon: Users },
  { label: 'Calendar', href: '/calendrier', icon: Calendar },
  { label: 'Communication', href: '/messagerie', icon: MessageSquare },
  { label: 'Administration', href: '/administration', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-inverse-surface flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Image src="/logo-icon.png" alt="TeamPilot" width={30} height={30} />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">TeamPilot AI</p>
            <p className="text-white/40 text-sm tracking-wide">Elite Tactical Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={24} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}