import { AlertTriangle, Clock } from 'lucide-react';
import type { Alert } from '@/types/aircraft';
import { RiskBadge } from './RiskBadge';

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

export function AlertCard({ alert, onClick }: AlertCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-left transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60"
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          alert.severity === 'High'
            ? 'bg-red-500/10 text-red-400'
            : alert.severity === 'Medium'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-emerald-500/10 text-emerald-400'
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {alert.aircraftId} — {alert.title}
          </p>
          <RiskBadge level={alert.severity} size="sm" />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{alert.description}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {alert.timestamp}
        </div>
      </div>
    </button>
  );
}
