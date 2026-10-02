import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  trend?: number;
  sublabel?: string;
}

const accentMap = {
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  red: {
    iconBg: 'bg-red-500/10 text-red-400',
    glow: 'shadow-red-500/10',
  },
  slate: {
    iconBg: 'bg-slate-500/10 text-slate-400',
    glow: 'shadow-slate-500/10',
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'blue',
  trend,
  sublabel,
}: KpiCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={`rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/60 hover:shadow-lg ${a.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {trend >= 0 ? '+' : ''}
            {trend}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}
