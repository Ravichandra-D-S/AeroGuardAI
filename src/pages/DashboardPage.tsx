import {
  Plane,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import type { PageId } from '@/types/aircraft';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { AlertCard } from '@/components/ui/AlertCard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { DonutChart } from '@/components/charts/DonutChart';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import {
  aircraft,
  alerts,
  riskDistribution,
  fleetAvailabilityTrend,
} from '@/data/aircraftData';

interface DashboardPageProps {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const total = aircraft.length;
  const operational = aircraft.filter((a) => a.status === 'Operational').length;
  const maintenance = aircraft.filter((a) => a.status === 'Maintenance').length;
  const highRisk = aircraft.filter((a) => a.riskLevel === 'High').length;
  const availability = Math.round((operational / total) * 100);

  const attentionAircraft = aircraft
    .filter((a) => a.riskLevel !== 'Low' || a.riskProbability >= 12)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fleet Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time overview of fleet health, availability, and risk indicators
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Aircraft" value={total} icon={Plane} accent="blue" />
        <KpiCard
          label="Operational"
          value={operational}
          icon={CheckCircle2}
          accent="emerald"
          sublabel={`${Math.round((operational / total) * 100)}% of fleet`}
        />
        <KpiCard label="Under Maintenance" value={maintenance} icon={Wrench} accent="amber" />
        <KpiCard label="High Risk" value={highRisk} icon={AlertTriangle} accent="red" />
        <KpiCard
          label="Fleet Availability"
          value={`${availability}%`}
          icon={Activity}
          accent="blue"
          trend={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Fleet Availability" subtitle="Operational / Total × 100">
          <div className="flex items-center justify-center py-2">
            <ProgressRing value={availability} color="#3b82f6" label="Available" />
          </div>
          <div className="mt-2 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-emerald-400">{operational}</p>
              <p className="text-xs text-slate-400">Operational</p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <p className="text-xl font-bold text-slate-400">{total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <p className="text-xl font-bold text-amber-400">{maintenance}</p>
              <p className="text-xs text-slate-400">In Maintenance</p>
            </div>
          </div>
        </Card>

        <Card title="Risk Distribution" subtitle="Aircraft by risk level">
          <DonutChart
            data={riskDistribution}
            centerValue={`${total}`}
            centerLabel="Aircraft"
          />
          <div className="mt-2 flex justify-center gap-4">
            {riskDistribution.map((r) => (
              <div key={r.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-xs text-slate-400">{r.name}: {r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Availability Trend" subtitle="Last 7 days">
          <AreaTrendChart data={fleetAvailabilityTrend} color="#3b82f6" yDomain={[60, 100]} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Aircraft Requiring Attention"
          subtitle="Sorted by risk priority"
          className="lg:col-span-2"
          action={
            <button
              onClick={() => onNavigate('fleet')}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Aircraft</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Risk</th>
                  <th className="pb-3 pr-4 font-semibold">Probability</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {attentionAircraft.map((ac) => (
                  <tr
                    key={ac.id}
                    onClick={() => onNavigate('aircraft-details', ac.id)}
                    className="cursor-pointer border-b border-slate-800/60 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="py-3 pr-4 font-semibold text-white">{ac.id}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs font-medium ${
                          ac.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {ac.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4"><RiskBadge level={ac.riskLevel} size="sm" /></td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-semibold ${
                          ac.riskProbability >= 60
                            ? 'text-red-400'
                            : ac.riskProbability >= 35
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {ac.riskProbability}%
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {ac.riskLevel === 'High'
                        ? 'Immediate inspection'
                        : ac.riskLevel === 'Medium'
                          ? 'Schedule maintenance'
                          : 'Routine monitoring'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recent Alerts" subtitle="Latest fleet notifications">
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => onNavigate('aircraft-details', alert.aircraftId)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
