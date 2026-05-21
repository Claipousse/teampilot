import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center px-6 gap-4 shrink-0">

      {/* Barre de recherche */}
      <div className="flex-1 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input
          type="text"
          placeholder="Search players, tactics, or logs..."
          className="w-full pl-11 pr-4 py-2.5 bg-surface-container rounded-xl text-base text-on-surface placeholder:text-outline border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Droite */}
      <div className="flex items-center gap-1 ml-auto">

        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
          <Bell size={20} className="text-on-surface-variant" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
          <Settings size={20} className="text-on-surface-variant" />
        </button>

        <div className="w-px h-8 bg-outline-variant mx-3" />

        {/* Profil */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-on-surface leading-tight">Alex Graham</p>
            <p className="text-xs text-primary uppercase tracking-widest font-semibold">Head Coach</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">AG</span>
          </div>
        </div>

      </div>
    </header>
  );
}