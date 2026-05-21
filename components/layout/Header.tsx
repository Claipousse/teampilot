import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-22 bg-surface-container-lowest border-b border-outline-variant flex items-center px-8 gap-4 shrink-0">

      {/* Barre de recherche */}
      <div className="flex-1 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
        <input
          type="text"
          placeholder="Search players, tactics, or logs..."
          className="w-full pl-12 pr-4 py-3 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Droite */}
      <div className="flex items-center ml-auto">

        {/* Notifications */}
        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
          <Bell size={30} className="text-on-surface-variant" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest" />
        </button>

        {/* Settings — écart explicite avec la cloche */}
        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors ml-2">
          <Settings size={30} className="text-on-surface-variant" />
        </button>

        <div className="w-px h-10 bg-outline-variant mx-5" />

        {/* Profil */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-on-surface leading-tight">Alex Graham</p>
            <p className="text-sm text-primary uppercase tracking-widest font-semibold">Head Coach</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-base font-bold">AG</span>
          </div>
        </div>

      </div>
    </header>
  );
}