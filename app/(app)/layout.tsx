import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Image from 'next/image';
import { Bell, Settings } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* Sidebar — desktop uniquement */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header — desktop uniquement */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Header mobile */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-surface-container-lowest border-b border-outline-variant shrink-0">
          {/* Logo + nom */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Image src="/logo-icon.png" alt="TeamPilot" width={24} height={24} />
            </div>
            <span className="text-base font-bold text-primary">TeamPilot AI</span>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2">
            {/* Cloche */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
              <Bell size={20} className="text-on-surface-variant" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
            </button>

            {/* Paramètres */}
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
              <Settings size={20} className="text-on-surface-variant" />
            </button>

            {/* Avatar profil */}
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">AG</span>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Bottom nav — mobile uniquement */}
        <BottomNav />

      </div>
    </div>
  );
}