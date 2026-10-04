import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, Calendar, AlertTriangle } from 'lucide-react';
import type { PageId } from '@/types/aircraft';

interface HeaderProps {
  onOpenSidebar: () => void;
  onNavigate: (target: PageId, aircraftId?: string) => void;
}

export function Header({ onOpenSidebar, onNavigate }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target as Node)
    ) {
      setShowProfile(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSearch = () => {
    const query = searchValue.trim().toUpperCase();

    if (!query) {
      setSearchMessage('');
      return;
    }

    const aircraftPattern = /^AF-\d{3}$/;

    if (!aircraftPattern.test(query)) {
      setSearchMessage('Enter an aircraft ID like AF-101');
      return;
    }

    const aircraftNumber = Number(query.replace('AF-', ''));

    if (aircraftNumber < 101 || aircraftNumber > 150) {
      setSearchMessage('Aircraft not found');
      return;
    }

    setSearchMessage('');
    onNavigate('aircraft-details', query);
    setSearchValue('');
  };

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
        <span className="text-sm font-semibold text-white">
          AeroGuard AI
        </span>

        <span className="hidden text-xs text-slate-500 md:inline">
          / Predictive Maintenance Platform
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="text"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setSearchMessage('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Search aircraft..."
            aria-label="Search aircraft"
            className="w-40 rounded-xl border border-slate-700/60 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:w-56 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 md:w-52"
          />

          {searchMessage && (
            <div className="absolute right-0 top-11 z-30 w-56 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-xl">
              {searchMessage}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 lg:flex">
          <Calendar className="h-4 w-4 text-slate-500" />

          <span className="text-xs font-medium text-slate-400">
            {today}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((current) => !current)}
            className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500">
                    Latest maintenance alerts
                  </p>
                </div>

                <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400">
                  3 Alerts
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('aircraft-details', 'AF-101');
                  }}
                  className="flex w-full gap-3 border-b border-slate-800 px-4 py-3 text-left transition-colors hover:bg-slate-800/70"
                >
                  <div className="mt-0.5 rounded-lg bg-red-500/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      High maintenance risk
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      AF-101 requires maintenance attention.
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Recent prediction
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('aircraft-details', 'AF-105');
                  }}
                  className="flex w-full gap-3 border-b border-slate-800 px-4 py-3 text-left transition-colors hover:bg-slate-800/70"
                >
                  <div className="mt-0.5 rounded-lg bg-orange-500/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Maintenance recommended
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      AF-105 has entered the maintenance watch list.
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Recent prediction
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('aircraft-details', 'AF-110');
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/70"
                >
                  <div className="mt-0.5 rounded-lg bg-yellow-500/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Fleet attention required
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      AF-110 should be reviewed by the maintenance team.
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Recent prediction
                    </p>
                  </div>
                </button>
              </div>

              <div className="border-t border-slate-700 px-4 py-2">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('fleet');
                  }}
                  className="w-full rounded-lg py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/10 hover:text-blue-300"
                >
                  View Fleet Monitoring
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
<div ref={profileRef} className="relative">
  <button
    onClick={() => setShowProfile((current) => !current)}
    className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 py-1.5 pl-1.5 pr-3 transition-colors hover:border-slate-600 hover:bg-slate-800"
    aria-label="User profile"
    aria-expanded={showProfile}
  >
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
      <User className="h-4 w-4 text-white" />
    </div>

    <div className="hidden text-left sm:block">
      <p className="text-xs font-semibold leading-tight text-white">
        Maint. Lead
      </p>

      <p className="text-[10px] leading-tight text-slate-400">
        Admin
      </p>
    </div>
  </button>

  {showProfile && (
    <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="border-b border-slate-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <User className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Maint. Lead
            </p>

            <p className="text-xs text-slate-400">
              Maintenance Administrator
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="rounded-lg bg-slate-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            System Access
          </p>

          <p className="mt-1 text-xs font-medium text-green-400">
            Active
          </p>
        </div>

        <div className="mt-2 rounded-lg bg-slate-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Role
          </p>

          <p className="mt-1 text-xs font-medium text-slate-300">
            Fleet Maintenance Lead
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700 px-4 py-3">
        <button
          onClick={() => setShowProfile(false)}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  )}
</div>
      </div>
    </header>
  );
}