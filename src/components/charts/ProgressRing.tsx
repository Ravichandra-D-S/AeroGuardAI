import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface ProgressRingProps {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  value,
  size = 200,
  color = '#3b82f6',
  label = 'Availability',
}: ProgressRingProps) {
  const data = [{ name: label, value, fill: color }];

  return (
    <div className="relative" style={{ height: size, width: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={90 - 360 * (value / 100)}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={8} fill={color} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{value}%</span>
        <span className="mt-1 text-xs font-medium text-slate-400">{label}</span>
      </div>
    </div>
  );
}
