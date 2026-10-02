import { useState } from 'react';
import {
  Thermometer,
  Activity,
  Gauge,
  Fuel,
  Clock,
  AlertCircle,
  Brain,
  Wrench,
  ChevronLeft,
  Plane,
} from 'lucide-react';
import type { PageId } from '@/types/aircraft';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { HealthCard, statusFromValue } from '@/components/ui/HealthCard';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { getAircraftById, getAircraftTrend } from '@/data/aircraftData';

interface AircraftDetailsPageProps {
  aircraftId: string;
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

export function AircraftDetailsPage({ aircraftId, onNavigate }: AircraftDetailsPageProps) {
  const ac = getAircraftById(aircraftId) ?? getAircraftById('A-104')!;
  const trend = getAircraftTrend(ac.id);
  const [predicting, setPredicting] = useState(false);

  const handleRunPrediction = () => {
    setPredicting(true);
    setTimeout(() => {
      setPredicting(false);
      onNavigate('prediction', ac.id);
    }, 600);
  };

  const riskGlow =
    ac.riskLevel === 'High'
      ? 'from-red-500/10 border-red-500/30'
      : ac.riskLevel === 'Medium'
        ? 'from-amber-500/10 border-amber-500/30'
        : 'from-emerald-500/10 border-emerald-500/30';

  const riskText =
    ac.riskLevel === 'High' ? 'text-red-400' : ac.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('fleet')}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Fleet
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{ac.id}</h1>
            <p className="text-sm text-slate-400">{ac.model} · Synthetic demo data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={ac.riskLevel} />
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              ac.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${ac.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {ac.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <HealthCard
          label="Engine Hours"
          value={ac.engineHours.toLocaleString()}
          icon={Gauge}
          status={statusFromValue(ac.engineHours, [1500, 2000])}
          max={2500}
        />
        <HealthCard
          label="Temperature"
          value={ac.temperature}
          unit="°C"
          icon={Thermometer}
          status={statusFromValue(ac.temperature, [75, 85])}
          max={120}
        />
        <HealthCard
          label="Vibration"
          value={ac.vibration.toFixed(2)}
          unit="g"
          icon={Activity}
          status={statusFromValue(ac.vibration, [0.55, 0.75])}
          max={1}
        />
        <HealthCard
          label="Fuel Efficiency"
          value={ac.fuelEfficiency}
          unit="%"
          icon={Fuel}
          status={ac.fuelEfficiency >= 85 ? 'good' : ac.fuelEfficiency >= 78 ? 'warning' : 'critical'}
          max={100}
        />
        <HealthCard
          label="Days Since Maint."
          value={ac.daysSinceMaintenance}
          icon={Clock}
          status={statusFromValue(ac.daysSinceMaintenance, [30, 45])}
          max={90}
        />
        <HealthCard
          label="Previous Faults"
          value={ac.previousFaults}
          icon={AlertCircle}
          status={ac.previousFaults >= 2 ? 'critical' : ac.previousFaults >= 1 ? 'warning' : 'good'}
          max={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Parameter Trend"
          subtitle={`Engine temperature — last 7 readings for ${ac.id}`}
          className="lg:col-span-2"
        >
          <LineTrendChart data={trend} color="#3b82f6" />
        </Card>

        <div className={`rounded-2xl border bg-gradient-to-br ${riskGlow} to-slate-800/40 p-6 backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">AI Risk Summary</h3>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Risk Level</span>
              <RiskBadge level={ac.riskLevel} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Risk Probability</span>
              <span className={`text-2xl font-bold ${riskText}`}>{ac.riskProbability}%</span>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendation</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                {ac.riskLevel === 'High'
                  ? 'Schedule preventive inspection based on the current synthetic health parameters.'
                  : ac.riskLevel === 'Medium'
                    ? 'Schedule maintenance within 7 days. Monitor health parameters closely.'
                    : 'Routine monitoring — no immediate action required.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <button
              onClick={handleRunPrediction}
              disabled={predicting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-cyan-400 disabled:opacity-50"
            >
              <Brain className="h-4 w-4" />
              {predicting ? 'Running AI Prediction...' : 'Run AI Prediction'}
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              <Wrench className="h-4 w-4" />
              View Maintenance Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
