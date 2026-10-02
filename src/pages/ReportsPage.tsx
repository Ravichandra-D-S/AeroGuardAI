import { useState } from 'react';
import { Download, FileBarChart, TrendingUp, AlertTriangle, Activity, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChartCard } from '@/components/charts/BarChartCard';
import {
  fleetAvailabilityTrend,
  riskDistribution,
  statusDistribution,
  maintenanceEvents,
  aircraft,
  maintenanceTasks,
} from '@/data/aircraftData';

type DateRange = '7' | '30' | '90';

export function ReportsPage() {
  const [range, setRange] = useState<DateRange>('30');

  const handleExport = () => {
    const rows = [
      ['Aircraft ID', 'Status', 'Risk Level', 'Risk Probability', 'Engine Hours', 'Temperature', 'Vibration', 'Fuel Efficiency', 'Days Since Maintenance', 'Previous Faults', 'Availability'],
      ...aircraft.map((a) => [
        a.id,
        a.status,
        a.riskLevel,
        `${a.riskProbability}%`,
        a.engineHours,
        a.temperature,
        a.vibration,
        `${a.fuelEfficiency}%`,
        a.daysSinceMaintenance,
        a.previousFaults,
        `${a.availability}%`,
      ]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeroguard-report-${range}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const rangeLabels: Record<DateRange, string> = {
    '7': 'Last 7 days',
    '30': 'Last 30 days',
    '90': 'Last 90 days',
  };

  const totalOperational = aircraft.filter((a) => a.status === 'Operational').length;
  const totalMaintenance = aircraft.filter((a) => a.status === 'Maintenance').length;
  const avgRisk = Math.round(aircraft.reduce((s, a) => s + a.riskProbability, 0) / aircraft.length);
  const completedTasks = maintenanceTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            Comprehensive fleet analytics and maintenance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-800/50 p-1">
            {(['7', '30', '90'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  range === r
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-cyan-400"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
          >
            <FileBarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Avg Fleet Availability', value: `${Math.round((totalOperational / aircraft.length) * 100)}%`, icon: Activity, accent: 'text-blue-400' },
          { label: 'Avg Risk Score', value: `${avgRisk}%`, icon: TrendingUp, accent: avgRisk >= 50 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Aircraft in Maintenance', value: totalMaintenance, icon: Wrench, accent: 'text-amber-400' },
          { label: 'High Risk Aircraft', value: aircraft.filter((a) => a.riskLevel === 'High').length, icon: AlertTriangle, accent: 'text-red-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                <Icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
              <p className={`mt-2 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Fleet Availability Trend" subtitle={`Availability over selected period (${rangeLabels[range]})`}>
          <AreaTrendChart data={fleetAvailabilityTrend} color="#3b82f6" yDomain={[60, 100]} />
        </Card>

        <Card title="Maintenance Risk Distribution" subtitle="Aircraft grouped by risk level">
          <DonutChart
            data={riskDistribution}
            centerValue={`${aircraft.length}`}
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

        <Card title="Aircraft Status Distribution" subtitle="Operational vs maintenance">
          <BarChartCard
            data={statusDistribution}
            colors={['#3b82f6', '#64748b']}
            height={220}
          />
          <div className="mt-2 flex justify-center gap-4">
            {statusDistribution.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Maintenance Events" subtitle="Completed vs planned by week">
          <BarChartCard
            data={maintenanceEvents.map((e) => ({ name: e.week, value: e.events }))}
            colors={['#f59e0b', '#3b82f6']}
            height={220}
          />
          <div className="mt-2 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-400">Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-400">Planned: {maintenanceEvents.reduce((s, e) => s + e.planned, 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Risk Prediction Summary" subtitle="Overview of AI risk predictions across the fleet">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Low Risk</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">
              {aircraft.filter((a) => a.riskLevel === 'Low').length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Routine monitoring recommended</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Medium Risk</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">
              {aircraft.filter((a) => a.riskLevel === 'Medium').length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Schedule maintenance within 7 days</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="text-sm font-semibold text-red-400">High Risk</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">
              {aircraft.filter((a) => a.riskLevel === 'High').length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Immediate inspection required</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Total Predictions</p>
              <p className="mt-1 text-xl font-bold text-white">{aircraft.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Probability</p>
              <p className="mt-1 text-xl font-bold text-white">{avgRisk}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tasks Completed</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">{completedTasks}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tasks Pending</p>
              <p className="mt-1 text-xl font-bold text-amber-400">{maintenanceTasks.length - completedTasks}</p>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500">
        All data is synthetic and for demonstration purposes only. Predictions are not real-world validated.
      </p>
    </div>
  );
}
