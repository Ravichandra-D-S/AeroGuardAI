import { useEffect, useMemo, useState } from 'react';
import { Plane, Search, Filter } from 'lucide-react';
import type { PageId, RiskLevel } from '@/types/aircraft';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface FleetMonitoringPageProps {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

type FilterId =
  | 'All'
  | 'Low Risk'
  | 'Medium Risk'
  | 'High Risk'
  | 'Critical Risk';

interface FleetRecord {
  record_id: string;
  aircraft_id: string;
  aircraft_model: string;
  failure_probability: number;
  failure_probability_percent: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remaining_useful_life_hours: number;
  maintenance_priority: string;
}

const filters: FilterId[] = [
  'All',
  'Low Risk',
  'Medium Risk',
  'High Risk',
  'Critical Risk',
];

const mapRiskLevel = (risk: FleetRecord['risk_level']): RiskLevel => {
  switch (risk) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    default:
      return 'Low';
  }
};

export function FleetMonitoringPage({
  onNavigate,
}: FleetMonitoringPageProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('All');
  const [fleet, setFleet] = useState<FleetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFleet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
  `${API_BASE_URL}/api/fleet`,
);

        if (!response.ok) {
          throw new Error(
            `Fleet request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

const records = Array.isArray(data)
  ? data
  : Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.aircraft)
      ? data.aircraft
      : null;

if (!records) {
  console.error('Unexpected fleet response:', data);
  throw new Error('Invalid fleet response from backend.');
}

setFleet(records);
      } catch (err) {
        console.error('Fleet loading error:', err);

        setError(
          'Unable to load live fleet data. Make sure the FastAPI backend is running on port 8000.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFleet();
  }, []);

  const filtered = useMemo(() => {
    return fleet.filter((aircraft) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        aircraft.aircraft_id.toLowerCase().includes(searchTerm) ||
        aircraft.aircraft_model.toLowerCase().includes(searchTerm);

      if (!matchesSearch) {
        return false;
      }

      switch (activeFilter) {
        case 'Low Risk':
          return aircraft.risk_level === 'LOW';

        case 'Medium Risk':
          return aircraft.risk_level === 'MEDIUM';

        case 'High Risk':
          return aircraft.risk_level === 'HIGH';

        case 'Critical Risk':
          return aircraft.risk_level === 'CRITICAL';

        default:
          return true;
      }
    });
  }, [fleet, search, activeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Fleet Monitoring
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Live aircraft risk and remaining useful life predictions from
          the AeroGuard AI backend
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or model..."
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />

            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />

              <p className="font-semibold text-white">
                Loading fleet predictions...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fetching live ML results from the AeroGuard AI backend.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] items-center justify-center p-6">
            <div className="max-w-md text-center">
              <h2 className="font-semibold text-red-400">
                Fleet Data Unavailable
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {error}
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="No aircraft found"
            description="Try adjusting your search or risk filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">
                    Aircraft ID
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Model
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Failure Risk
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Remaining Useful Life
                  </th>

                  <th className="pb-3 pr-4 font-semibold">
                    Risk
                  </th>

                  <th className="pb-3 font-semibold">
                    Maintenance Priority
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((record) => {
                  const riskLevel = mapRiskLevel(record.risk_level);

                  const rulClass =
                    record.remaining_useful_life_hours < 100
                      ? 'text-red-400'
                      : record.remaining_useful_life_hours < 200
                        ? 'text-orange-400'
                        : record.remaining_useful_life_hours < 300
                          ? 'text-amber-400'
                          : 'text-emerald-400';

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
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-white">
                          {record.aircraft_id}
                        </div>

                        <div className="text-xs text-slate-500">
                          {record.record_id}
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-slate-300">
                        {record.aircraft_model}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={
                            record.failure_probability_percent >= 75
                              ? 'font-semibold text-red-400'
                              : record.failure_probability_percent >= 50
                                ? 'font-semibold text-orange-400'
                                : record.failure_probability_percent >= 25
                                  ? 'font-semibold text-amber-400'
                                  : 'font-semibold text-emerald-400'
                          }
                        >
                          {record.failure_probability_percent.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <span className={`font-medium ${rulClass}`}>
                          {record.remaining_useful_life_hours.toFixed(1)} h
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <RiskBadge
                          level={riskLevel}
                          size="sm"
                        />
                      </td>

                      <td className="py-3">
                        <span className="text-xs font-medium text-slate-300">
                          {record.maintenance_priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-slate-500">
        Showing {filtered.length} of {fleet.length} ML prediction records —
        synthetic demonstration data
      </p>
    </div>
  );
}