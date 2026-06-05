import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import MobileHeader from '@/components/layout/MobileHeader';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
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
            <MobileHeader />

            {/* Contenu */}
            <main className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-6">
              {children}
            </main>

            {/* Bottom nav — mobile uniquement */}
            <BottomNav />

          </div>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}
