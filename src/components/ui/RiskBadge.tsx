import type { RiskLevel } from '@/types/aircraft';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

const styles: Record<RiskLevel, string> = {
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  High: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const dotStyles: Record<RiskLevel, string> = {
  Low: 'bg-emerald-400',
  Medium: 'bg-amber-400',
  High: 'bg-red-400',
};

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${padding} ${styles[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[level]}`} />
      {level}
    </span>
  );
}
