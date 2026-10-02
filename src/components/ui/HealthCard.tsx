import { Gauge } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HealthCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status: 'good' | 'warning' | 'critical';
  max?: number;
}

const statusStyles = {
  good: {
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    bar: 'bg-emerald-500',
  },
  warning: {
    iconBg: 'bg-amber-500/10 text-amber-400',
    bar: 'bg-amber-500',
  },
  critical: {
    iconBg: 'bg-red-500/10 text-red-400',
    bar: 'bg-red-500',
  },
};

function statusFromValue(value: number, thresholds: [number, number]): 'good' | 'warning' | 'critical' {
  if (value >= thresholds[1]) return 'critical';
  if (value >= thresholds[0]) return 'warning';
  return 'good';
}

export function HealthCard({ label, value, unit, icon: Icon, status, max }: HealthCardProps) {
  const s = statusStyles[status];
  const pct = max ? Math.min((Number(value) / max) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-colors hover:border-slate-600/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {max && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
          <div className={`h-full rounded-full transition-all duration-500 ${s.bar}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export { statusFromValue };
