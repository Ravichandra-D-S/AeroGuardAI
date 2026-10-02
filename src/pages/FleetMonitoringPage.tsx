import { useState, useMemo } from 'react';
import { Plane, Search, Filter } from 'lucide-react';
import type { PageId } from '@/types/aircraft';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { aircraft } from '@/data/aircraftData';

interface FleetMonitoringPageProps {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

type FilterId = 'All' | 'Operational' | 'Maintenance' | 'Low Risk' | 'Medium Risk' | 'High Risk';

const filters: FilterId[] = ['All', 'Operational', 'Maintenance', 'Low Risk', 'Medium Risk', 'High Risk'];

export function FleetMonitoringPage({ onNavigate }: FleetMonitoringPageProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('All');

  const filtered = useMemo(() => {
    return aircraft.filter((a) => {
      const matchesSearch =
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.model.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'Operational':
          return a.status === 'Operational';
        case 'Maintenance':
          return a.status === 'Maintenance';
        case 'Low Risk':
          return a.riskLevel === 'Low';
        case 'Medium Risk':
          return a.riskLevel === 'Medium';
        case 'High Risk':
          return a.riskLevel === 'High';
        default:
          return true;
      }
    });
  }, [search, activeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fleet Monitoring</h1>
        <p className="mt-1 text-sm text-slate-400">
          Search and filter all aircraft in the fleet — click any row for detailed health data
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
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeFilter === f
                    ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="No aircraft found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Aircraft ID</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Engine Hours</th>
                  <th className="pb-3 pr-4 font-semibold">Temp (°C)</th>
                  <th className="pb-3 pr-4 font-semibold">Vibration</th>
                  <th className="pb-3 pr-4 font-semibold">Days Since Maint.</th>
                  <th className="pb-3 pr-4 font-semibold">Risk</th>
                  <th className="pb-3 font-semibold">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ac) => (
                  <tr
                    key={ac.id}
                    onClick={() => onNavigate('aircraft-details', ac.id)}
                    className="cursor-pointer border-b border-slate-800/60 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-white">{ac.id}</div>
                      <div className="text-xs text-slate-500">{ac.model}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          ac.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ac.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {ac.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{ac.engineHours.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={ac.temperature >= 85 ? 'text-red-400' : ac.temperature >= 75 ? 'text-amber-400' : 'text-emerald-400'}>
                        {ac.temperature}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={ac.vibration >= 0.75 ? 'text-red-400' : ac.vibration >= 0.55 ? 'text-amber-400' : 'text-emerald-400'}>
                        {ac.vibration.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={ac.daysSinceMaintenance >= 45 ? 'text-red-400' : ac.daysSinceMaintenance >= 30 ? 'text-amber-400' : 'text-slate-300'}>
                        {ac.daysSinceMaintenance}
                      </span>
                    </td>
                    <td className="py-3 pr-4"><RiskBadge level={ac.riskLevel} size="sm" /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700/50">
                          <div
                            className={`h-full rounded-full ${
                              ac.availability >= 90 ? 'bg-emerald-500' : ac.availability >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${ac.availability}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-400">{ac.availability}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-slate-500">
        Showing {filtered.length} of {aircraft.length} aircraft — synthetic demo data
      </p>
    </div>
  );
}

