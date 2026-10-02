import {
  LayoutDashboard,
  Plane,
  FileText,
  Brain,
  Wrench,
  BarChart3,
  Radar,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageId } from '@/types/aircraft';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fleet', label: 'Fleet Monitoring', icon: Plane },
  { id: 'aircraft-details', label: 'Aircraft Details', icon: FileText },
  { id: 'prediction', label: 'AI Risk Prediction', icon: Brain },
  { id: 'planner', label: 'Maintenance Planner', icon: Wrench },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-700/60 bg-slate-900/95 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-700/60 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
              <Radar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">AeroGuard AI</p>
              <p className="text-[10px] leading-tight text-slate-400">Predictive Maintenance</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = current === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {item.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-700/60 p-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              System Status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">All Systems Online</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Mock prediction engine active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
