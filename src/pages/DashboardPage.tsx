
import { useEffect, useMemo, useState } from 'react';
import {
  Plane,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import type { PageId, RiskLevel } from '@/types/aircraft';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { AlertCard } from '@/components/ui/AlertCard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { DonutChart } from '@/components/charts/DonutChart';

interface DashboardPageProps {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

interface FleetSummary {
  total_aircraft: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  attention_required: number;
  average_predicted_rul_hours: number;
}

interface FleetRecord {
  record_id: string;
  aircraft_id: string;
  aircraft_model: string;
  failure_probability: number;
  failure_probability_percent: number;
  risk_level: string;
  remaining_useful_life_hours: number;
  maintenance_priority: string;
}

interface AlertRecord {
  record_id: string;
  aircraft_id: string;
  aircraft_model: string;
  severity: string;
  risk_level: string;
  failure_probability_percent: number;
  remaining_useful_life_hours: number;
  maintenance_priority: string;
  message: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function mapRiskLevel(level: string): RiskLevel {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    default:
      return 'Low';
  }
}

function getAction(risk: string, rul: number): string {
  const normalizedRisk = risk.toUpperCase();

  if (normalizedRisk === 'CRITICAL' || rul < 100) {
    return 'Immediate maintenance';
  }

  if (normalizedRisk === 'HIGH' || rul < 200) {
    return 'Priority inspection';
  }

  if (normalizedRisk === 'MEDIUM' || rul < 300) {
    return 'Schedule maintenance';
  }

  return 'Routine monitoring';
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [fleetRecords, setFleetRecords] = useState<FleetRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryResponse, fleetResponse, alertsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/fleet/summary`),
          fetch(`${API_BASE_URL}/api/fleet`),
          fetch(`${API_BASE_URL}/api/alerts`),
        ]);

      if (!summaryResponse.ok) {
        throw new Error('Failed to load fleet summary.');
      }

      if (!fleetResponse.ok) {
        throw new Error('Failed to load fleet records.');
      }

      if (!alertsResponse.ok) {
        throw new Error('Failed to load alerts.');
      }

      const summaryData = await summaryResponse.json();
      const fleetData = await fleetResponse.json();
      const alertsData = await alertsResponse.json();

      setSummary(summaryData.summary);
      const fleetRecordsData: FleetRecord[] = Array.isArray(fleetData)
  ? fleetData
  : Array.isArray(fleetData.records)
    ? fleetData.records
    : Array.isArray(fleetData.aircraft)
      ? fleetData.aircraft
      : [];

setFleetRecords(fleetRecordsData);
      setAlerts(alertsData.alerts ?? []);
    } catch (err) {
      console.error('Dashboard loading error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the AeroGuard AI backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const availability = useMemo(() => {
    if (!summary || summary.total_aircraft === 0) {
      return 0;
    }

    return Math.round(
      ((summary.total_aircraft - summary.attention_required) /
        summary.total_aircraft) *
        100,
    );
  }, [summary]);

  const riskDistribution = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        name: 'Low',
        value: summary.low,
        color: '#22c55e',
      },
      {
        name: 'Medium',
        value: summary.medium,
        color: '#eab308',
      },
      {
        name: 'High',
        value: summary.high,
        color: '#f97316',
      },
      {
        name: 'Critical',
        value: summary.critical,
        color: '#ef4444',
      },
    ];
  }, [summary]);

  const attentionAircraft = useMemo(() => {
    return [...fleetRecords]
      .filter((record) => record.risk_level !== 'LOW')
      .sort((a, b) => {
        const riskOrder: Record<string, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        const riskDifference =
          (riskOrder[b.risk_level] ?? 0) -
          (riskOrder[a.risk_level] ?? 0);

        if (riskDifference !== 0) {
          return riskDifference;
        }

        return (
          b.failure_probability_percent -
          a.failure_probability_percent
        );
      })
      .slice(0, 5);
  }, [fleetRecords]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />

          <p className="mt-3 text-sm text-slate-400">
            Loading fleet dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Fleet Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Real-time overview of fleet health, availability, and risk
            indicators
          </p>
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400" />

            <h2 className="mt-4 text-lg font-semibold text-white">
              Dashboard data unavailable
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-400">
              {error ||
                'The AeroGuard AI backend did not return the required dashboard data.'}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Fleet Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Real-time overview of fleet health, availability, and risk
            indicators
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-emerald-400">
              Live backend data
            </span>

            <span className="text-xs text-slate-500">
              • Synthetic demo dataset
            </span>
          </div>
        </div>

        <button
          onClick={loadDashboard}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label="Total Aircraft"
          value={summary.total_aircraft}
          icon={Plane}
          accent="blue"
        />

        <KpiCard
          label="Available"
          value={
            summary.total_aircraft - summary.attention_required
          }
          icon={CheckCircle2}
          accent="emerald"
          sublabel={`${availability}% of fleet`}
        />

        <KpiCard
          label="Attention Required"
          value={summary.attention_required}
          icon={Wrench}
          accent="amber"
          sublabel="Priority monitoring"
        />

        <KpiCard
          label="High Risk"
          value={summary.high + summary.critical}
          icon={AlertTriangle}
          accent="red"
          sublabel={`${summary.critical} critical`}
        />

        <KpiCard
          label="Fleet Availability"
          value={`${availability}%`}
          icon={Activity}
          accent="blue"
        />
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Availability */}
        <Card
          title="Fleet Availability"
          subtitle="Based on aircraft requiring attention"
        >
          <div className="flex items-center justify-center py-2">
            <ProgressRing
              value={availability}
              color="#3b82f6"
              label="Available"
            />
          </div>

          <div className="mt-2 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-emerald-400">
                {summary.total_aircraft -
                  summary.attention_required}
              </p>

              <p className="text-xs text-slate-400">
                Available
              </p>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div>
              <p className="text-xl font-bold text-slate-300">
                {summary.total_aircraft}
              </p>

              <p className="text-xs text-slate-400">
                Total
              </p>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div>
              <p className="text-xl font-bold text-amber-400">
                {summary.attention_required}
              </p>

              <p className="text-xs text-slate-400">
                Attention
              </p>
            </div>
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card
          title="Risk Distribution"
          subtitle="Aircraft by predicted risk level"
        >
          <DonutChart
            data={riskDistribution}
            centerValue={`${summary.total_aircraft}`}
            centerLabel="Aircraft"
          />

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {riskDistribution.map((risk) => (
              <div
                key={risk.name}
                className="flex items-center gap-1.5"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: risk.color }}
                />

                <span className="text-xs text-slate-400">
                  {risk.name}: {risk.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* RUL */}
        <Card
          title="Predicted Fleet RUL"
          subtitle="Average remaining useful life"
        >
          <div className="flex h-full flex-col items-center justify-center py-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-400">
               {typeof summary.average_predicted_rul_hours === 'number'
  ? summary.average_predicted_rul_hours.toFixed(1)
  : '—'}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                hours average RUL
              </p>
            </div>

            <div className="mt-6 w-full max-w-xs">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-slate-500">
                  Fleet health indicator
                </span>

                <span className="text-slate-400">
                  {summary.average_predicted_rul_hours < 100
                    ? 'Critical'
                    : summary.average_predicted_rul_hours < 200
                      ? 'High attention'
                      : summary.average_predicted_rul_hours < 300
                        ? 'Monitor'
                        : 'Normal'}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(
                      (summary.average_predicted_rul_hours / 400) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Attention + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Aircraft Requiring Attention */}
        <Card
          title="Aircraft Requiring Attention"
          subtitle="Sorted by predicted risk priority"
          className="lg:col-span-2"
          action={
            <button
              onClick={() => onNavigate('fleet')}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">
                    Aircraft
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Model
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Risk
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Probability
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    RUL
                  </th>

                  <th className="pb-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {attentionAircraft.map((record) => {
                  const riskLevel = mapRiskLevel(
                    record.risk_level,
                  );

                  return (
                    <tr
                      key={record.record_id}
                      onClick={() =>
                        onNavigate(
                          'aircraft-details',
                          record.aircraft_id,
                        )
                      }
                      className="cursor-pointer border-b border-slate-800/60 transition-colors hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-4 font-semibold text-white">
                        {record.aircraft_id}
                      </td>

                      <td className="py-3 pr-4 text-slate-400">
                        {record.aircraft_model}
                      </td>

                      <td className="py-3 pr-4">
                        <RiskBadge
                          level={riskLevel}
                          size="sm"
                        />
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={`font-semibold ${
                            record.failure_probability_percent >=
                            75
                              ? 'text-red-400'
                              : record.failure_probability_percent >=
                                  50
                                ? 'text-orange-400'
                                : record.failure_probability_percent >=
                                    25
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                          }`}
                        >
                          {record.failure_probability_percent.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-slate-300">
                        {record.remaining_useful_life_hours.toFixed(
                          1,
                        )}
                        h
                      </td>

                      <td className="py-3 text-xs text-slate-400">
                        {getAction(
                          record.risk_level,
                          record.remaining_useful_life_hours,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {attentionAircraft.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No aircraft currently require attention.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card
          title="Recent Alerts"
          subtitle="Latest fleet notifications"
        >
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((alert) => {
              const mappedAlert = {
                id: alert.record_id,
                aircraftId: alert.aircraft_id,
                title: `${alert.severity} Risk Alert`,
                description: `${alert.message} Predicted failure risk: ${alert.failure_probability_percent.toFixed(
                  1,
                )}%. RUL: ${alert.remaining_useful_life_hours.toFixed(
                  1,
                )} hours.`,
                severity: mapRiskLevel(alert.severity),
                timestamp: 'Live prediction',
              };

              return (
                <AlertCard
                  key={alert.record_id}
                  alert={mappedAlert}
                  onClick={() =>
                    onNavigate(
                      'aircraft-details',
                      alert.aircraft_id,
                    )
                  }
                />
              );
            })}

            {alerts.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No active alerts.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

