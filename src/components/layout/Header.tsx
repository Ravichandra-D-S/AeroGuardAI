import { Search, Bell, User, Menu, Calendar } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-700/60 bg-slate-900/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-sm font-semibold text-white">AeroGuard AI</span>
        <span className="hidden text-xs text-slate-500 md:inline">/ Predictive Maintenance Platform</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search aircraft, alerts..."
            className="w-40 rounded-xl border border-slate-700/60 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:w-56 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 md:w-52"
          />
        </div>

        <div className="hidden items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 lg:flex">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-400">{today}</span>
        </div>

        <button
          className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
        </button>

        <button
          className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 py-1.5 pl-1.5 pr-3 transition-colors hover:border-slate-600 hover:bg-slate-800"
          aria-label="User profile"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-white">Maint. Lead</p>
            <p className="text-[10px] leading-tight text-slate-400">Admin</p>
          </div>
        </button>
      </div>
    </header>
  );
}
