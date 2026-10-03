
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Brain,
  ChevronLeft,
  Clock,
  Activity,
  Plane,
  Wrench,
} from 'lucide-react';

import type { PageId, RiskLevel } from '@/types/aircraft';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { HealthCard } from '@/components/ui/HealthCard';

interface AircraftDetailsPageProps {
  aircraftId: string;
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

interface AircraftRecord {
  record_id: string;
  aircraft_id: string;
  aircraft_model: string;
  failure_probability: number;
  failure_probability_percent: number;
  risk_level: string;
  remaining_useful_life_hours: number;
  maintenance_priority: string;
}

interface AircraftDetails {
  aircraft_id: string;
  aircraft_model: string;
  records_analyzed: number;
  average_failure_probability_percent: number;
  highest_failure_probability_percent: number;
  minimum_predicted_rul_hours: number;
  risk_level: string;
  maintenance_priority: string;
  records?: AircraftRecord[];
}

const API_BASE_URL = 'http://127.0.0.1:8000';

function normalizeRiskLevel(risk: string): RiskLevel {
  const value = risk.toUpperCase();

  if (value === 'CRITICAL') return 'Critical';
  if (value === 'HIGH') return 'High';
  if (value === 'MEDIUM') return 'Medium';

  return 'Low';
}

function getRiskTextClass(risk: RiskLevel) {
  if (risk === 'Critical') return 'text-red-400';
  if (risk === 'High') return 'text-orange-400';
  if (risk === 'Medium') return 'text-amber-400';

  return 'text-emerald-400';
}

function getRiskGlow(risk: RiskLevel) {
  if (risk === 'Critical') {
    return 'from-red-500/10 border-red-500/30';
  }

  if (risk === 'High') {
    return 'from-orange-500/10 border-orange-500/30';
  }

  if (risk === 'Medium') {
    return 'from-amber-500/10 border-amber-500/30';
  }

  return 'from-emerald-500/10 border-emerald-500/30';
}

function getRecommendation(risk: RiskLevel, rul: number) {
  if (risk === 'Critical' || rul < 100) {
    return 'Immediate maintenance attention is recommended based on the synthetic prediction. Prioritize inspection of the aircraft and relevant components.';
  }

  if (risk === 'High' || rul < 200) {
    return 'Schedule preventive maintenance soon and closely monitor the aircraft health indicators.';
  }

  if (risk === 'Medium' || rul < 300) {
    return 'Continue monitoring and schedule maintenance before the predicted remaining useful life becomes critical.';
  }

  return 'Routine monitoring is recommended. No immediate maintenance action is indicated by the synthetic prediction.';
}

export function AircraftDetailsPage({
  aircraftId,
  onNavigate,
}: AircraftDetailsPageProps) {
  const [aircraft, setAircraft] = useState<AircraftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [predicting, setPredicting] = useState(false);

  const loadAircraft = async () => {
    try {
      setLoading(true);
      setError('');

      const normalizedAircraftId = aircraftId?.trim();

if (!normalizedAircraftId) {
  throw new Error('No aircraft ID was provided.');
}

const response = await fetch(
  `${API_BASE_URL}/api/aircraft/${encodeURIComponent(normalizedAircraftId)}`
);

      if (!response.ok) {
       throw new Error(`Aircraft ${normalizedAircraftId} was not found.`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || 'Unable to load aircraft details.'
        );
      }

      const details = data.aircraft ?? data;

      setAircraft({
        aircraft_id: details.aircraft_id,
        aircraft_model: details.aircraft_model,
        records_analyzed: details.records_analyzed ?? 0,
        average_failure_probability_percent:
          details.average_failure_probability_percent ?? 0,
        highest_failure_probability_percent:
          details.highest_failure_probability_percent ?? 0,
        minimum_predicted_rul_hours:
          details.minimum_predicted_rul_hours ?? 0,
        risk_level: details.risk_level ?? 'LOW',
        maintenance_priority:
          details.maintenance_priority ?? 'NORMAL',
        records: data.records ?? details.records ?? [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load aircraft details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAircraft();
  }, [aircraftId]);

  const handleRunPrediction = () => {
    setPredicting(true);

    setTimeout(() => {
      setPredicting(false);
      onNavigate('prediction', aircraftId);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />

          <p className="mt-4 text-sm text-slate-400">
            Loading aircraft details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('fleet')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Fleet
        </button>

        <Card>
          <div className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

            <h2 className="mt-4 text-lg font-semibold text-white">
              Unable to Load Aircraft
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              {error || 'Aircraft details are unavailable.'}
            </p>

            <button
              onClick={loadAircraft}
              className="mt-5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const risk = normalizeRiskLevel(aircraft.risk_level);
  const riskText = getRiskTextClass(risk);
  const riskGlow = getRiskGlow(risk);

  const records = [...(aircraft.records ?? [])]
    .sort(
      (a, b) =>
        b.failure_probability - a.failure_probability
    )
    .slice(0, 10);

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
            <h1 className="text-2xl font-bold text-white">
              {aircraft.aircraft_id}
            </h1>

            <p className="text-sm text-slate-400">
              {aircraft.aircraft_model} · Synthetic demo data
            </p>
          </div>
        </div>

        <RiskBadge level={risk} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        <span className="text-sm text-slate-300">
          Live aircraft analysis from the AeroGuard AI backend
        </span>

        <span className="ml-auto text-xs text-slate-500">
          XGBoost + synthetic dataset
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <HealthCard
          label="Records"
          value={aircraft.records_analyzed}
          icon={Activity}
          status="good"
          max={10}
        />

        <HealthCard
          label="Avg Failure Risk"
          value={aircraft.average_failure_probability_percent.toFixed(1)}
          unit="%"
          icon={AlertCircle}
          status={
            aircraft.average_failure_probability_percent >= 75
              ? 'critical'
              : aircraft.average_failure_probability_percent >= 50
                ? 'warning'
                : 'good'
          }
          max={100}
        />

        <HealthCard
          label="Highest Risk"
          value={aircraft.highest_failure_probability_percent.toFixed(1)}
          unit="%"
          icon={AlertCircle}
          status={
            aircraft.highest_failure_probability_percent >= 75
              ? 'critical'
              : aircraft.highest_failure_probability_percent >= 50
                ? 'warning'
                : 'good'
          }
          max={100}
        />

        <HealthCard
          label="Minimum RUL"
          value={aircraft.minimum_predicted_rul_hours.toFixed(1)}
          unit="hrs"
          icon={Clock}
          status={
            aircraft.minimum_predicted_rul_hours < 100
              ? 'critical'
              : aircraft.minimum_predicted_rul_hours < 200
                ? 'warning'
                : 'good'
          }
          max={400}
        />

        <HealthCard
          label="Maintenance"
          value={aircraft.maintenance_priority}
          icon={Wrench}
          status={
            aircraft.maintenance_priority === 'CRITICAL'
              ? 'critical'
              : aircraft.maintenance_priority === 'HIGH'
                ? 'warning'
                : 'good'
          }
          max={100}
        />

        <HealthCard
          label="Risk Level"
          value={risk}
          icon={Brain}
          status={
            risk === 'Critical' || risk === 'High'
              ? 'critical'
              : risk === 'Medium'
                ? 'warning'
                : 'good'
          }
          max={100}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Prediction Records"
          subtitle={`Recent model results for ${aircraft.aircraft_id}`}
          className="lg:col-span-2"
        >
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-

h-[720px]">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Record
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Failure Risk
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Risk
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      RUL
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Priority
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.record_id}
                      className="border-b border-slate-800/60 last:border-0"
                    >
                      <td className="px-3 py-4 text-sm font-medium text-white">
                        {record.record_id}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-200">
                        {record.failure_probability_percent.toFixed(1)}%
                      </td>

                      <td className="px-3 py-4">
                        <RiskBadge
                          level={normalizeRiskLevel(record.risk_level)}
                        />
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-300">
                        {record.remaining_useful_life_hours.toFixed(1)} hrs
                      </td>

                      <td className="px-3 py-4 text-sm font-medium text-slate-300">
                        {record.maintenance_priority}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">
                No individual prediction records were returned by the backend.
              </p>
            </div>
          )}
        </Card>

        <div
          className={`rounded-2xl border bg-gradient-to-br ${riskGlow} to-slate-800/40 p-6 backdrop-blur-sm`}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">
              AI Risk Summary
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Risk Level
              </span>
              <RiskBadge level={risk} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Average Risk
              </span>
              <span className={`text-2xl font-bold ${riskText}`}>
                {aircraft.average_failure_probability_percent.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Minimum RUL
              </span>
              <span className="text-lg font-bold text-white">
                {aircraft.minimum_predicted_rul_hours.toFixed(1)} hrs
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recommendation
              </p>

              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                {getRecommendation(
                  risk,
                  aircraft.minimum_predicted_rul_hours
                )}
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
              {predicting
                ? 'Running AI Prediction...'
                : 'Run AI Prediction'}
            </button>

            <button
              onClick={() => onNavigate('planner', aircraft.aircraft_id)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              <Wrench className="h-4 w-4" />
              View Maintenance Plan
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-blue-300">
            Demo data notice:
          </span>{' '}
          These predictions are generated from synthetic aircraft maintenance
          data for the AeroGuard AI hackathon prototype. They are intended for
          demonstration and should not be interpreted as real operational
          aircraft maintenance recommendations.
        </p>
      </div>
    </div>
  );
}
