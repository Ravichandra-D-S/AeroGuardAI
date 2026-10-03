
import { useEffect, useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarPlus,
  Plane,
  RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageId, RiskLevel } from '@/types/aircraft';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Modal } from '@/components/ui/Modal';

interface Props {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

interface FleetRecord {
  record_id: string;
  aircraft_id: string;
  aircraft_model: string;
  failure_probability_percent: number;
  risk_level: RiskLevel;
  remaining_useful_life_hours: number;
  maintenance_priority: string;
}

type Status = 'Pending' | 'Planned' | 'Completed';

interface Task {
  id: string;
  aircraftId: string;
  model: string;
  riskLevel: RiskLevel;
  priority: 1 | 2 | 3 | 4;
  action: string;
  schedule: string;
  failureRisk: number;
  rul: number;
  status: Status;
}

interface PriorityCard {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  count: (tasks: Task[]) => number;
}

const API = 'http://127.0.0.1:8000';

const priorityCards: PriorityCard[] = [
  {
    label: 'Immediate',
    icon: Flame,
    color: 'text-red-400',
    bg: 'bg-red-500/10 text-red-400',
    count: (t) => t.filter((x) => x.priority === 1 && x.status !== 'Completed').length,
  },
  {
    label: 'High Priority',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 text-amber-400',
    count: (t) => t.filter((x) => x.priority === 2 && x.status !== 'Completed').length,
  },
  {
    label: 'Medium',
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 text-blue-400',
    count: (t) => t.filter((x) => x.priority === 3 && x.status !== 'Completed').length,
  },
  {
    label: 'Routine',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 text-emerald-400',
    count: (t) => t.filter((x) => x.priority === 4 && x.status !== 'Completed').length,
  },
];

const statusStyles: Record<Status, string> = {
  Pending: 'bg-red-500/10 text-red-400 border-red-500/30',
  Planned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

function getPriority(
  priority: string,
  risk: RiskLevel,
  rul: number,
): 1 | 2 | 3 | 4 {
  if (priority === 'CRITICAL' || risk === 'CRITICAL' || rul < 100) return 1;
  if (priority === 'HIGH' || risk === 'HIGH' || rul < 200) return 2;
  if (priority === 'MEDIUM' || risk === 'MEDIUM' || rul < 300) return 3;
  return 4;
}

function getAction(priority: number): string {
  if (priority === 1) return 'Immediate inspection and maintenance required';
  if (priority === 2) return 'Schedule priority maintenance inspection';
  if (priority === 3) return 'Plan preventive maintenance';
  return 'Continue monitoring and routine maintenance';
}

function getSchedule(priority: number, rul: number): string {
  if (priority === 1) return 'Immediate';
  if (priority === 2) return rul < 150 ? 'Within 24 hours' : 'Within 3 days';
  if (priority === 3) return rul < 250 ? 'Within 7 days' : 'Within 14 days';
  return 'Next scheduled service';
}

function makeTask(record: FleetRecord): Task {
  const priority = getPriority(
    record.maintenance_priority,
    record.risk_level,
    record.remaining_useful_life_hours,
  );

  return {
    id: record.record_id,
    aircraftId: record.aircraft_id,
    model: record.aircraft_model,
    riskLevel: record.risk_level,
    priority,
    action: getAction(priority),
    schedule: getSchedule(priority, record.remaining_useful_life_hours),
    failureRisk: record.failure_probability_percent,
    rul: record.remaining_useful_life_hours,
    status: 'Pending',
  };
}

export function MaintenancePlannerPage({ onNavigate }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API}/api/fleet`);

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

const records: FleetRecord[] = Array.isArray(data)
  ? data
  : Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.aircraft)
      ? data.aircraft
      : [];

if (records.length === 0) {
  throw new Error('No fleet records returned from backend.');
}

const generated = records
  .map(makeTask)
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }

          return a.rul - b.rul;
        });

      setTasks(generated);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSchedule = () => {
    if (!selectedTask) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id
          ? { ...task, status: 'Planned' }
          : task,
      ),
    );

    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">
              Maintenance Planner
            </h1>

            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-400">
              Live AI Data
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Plan preventive maintenance using AI-predicted aircraft risk and
            remaining useful life.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Synthetic demo dataset • Recommendations are for demonstration
            only.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadTasks}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => onNavigate('prediction')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <CalendarPlus className="h-4 w-4" />
            New Prediction
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">
            Unable to load maintenance data
          </p>
          <p className="mt-1 text-xs text-red-300">{error}</p>

          <button
            onClick={loadTasks}
            className="mt-3 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {priorityCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">
                      {card.label}
                    </span>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <p className={`mt-2 text-3xl font-bold ${card.color}`}>
                    {loading ? '—' : card.count(tasks)}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    tasks pending
                  </p>
                </div>
              );
            })}
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  AI Maintenance Schedule
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Generated from live fleet predictions
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {loading ? 'Loading...' : `${tasks.length} total tasks`}
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading AI maintenance recommendations...
                  </p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="mt-3 text-sm font-semibold text-white">
                  No maintenance tasks found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Aircraft</th>
                      <th className="pb-3 pr-4">Risk</th>
                      <th className="pb-3 pr-4">Priority</th>
                      <th className="pb-3 pr-4">Failure Risk</th>
                      <th className="pb-3 pr-4">Predicted RUL</th>
                      <th className="pb-3 pr-4">Recommended Action</th>
                      <th className="pb-3 pr-4">Schedule</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30"
                      >
                        <td className="py-3 pr-4">
                          <button
                            onClick={() =>
                              onNavigate(
                                'aircraft-details',
                                task.aircraftId,
                              )
                            }
                            className="flex items-center gap-2 font-semibold text-white hover:text-blue-400"
                          >
                            <Plane className="h-3.5 w-3.5 text-slate-500" />
                            {task.aircraftId}
                          </button>

                          <span className="ml-5 text-xs text-slate-500">
                            {task.model}
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          <RiskBadge level={task.riskLevel} size="sm" />
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                              task.priority === 1
                                ? 'bg-red-500/10 text-red-400'
                                : task.priority === 2
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : task.priority === 3
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          <span className="font-semibold text-slate-200">
                            {task.failureRisk.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          <span className="font-semibold text-slate-300">
                            {task.rul.toFixed(1)} h
                          </span>
                        </td>
<td className="max-w-[260px] py-3 pr-4 text-slate-300">
  {task.action}
</td>

<td className="py-3 pr-4 text-slate-400">
  {task.schedule}
</td>

<td className="py-3 pr-4">
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        task.status === 'Completed'
          ? 'bg-emerald-400'
          : task.status === 'Planned'
            ? 'bg-blue-400'
            : 'bg-red-400'
      }`}
    />
    {task.status}
  </span>
</td>

<td className="py-3">
  {task.status !== 'Completed' ? (
    <button
      onClick={() => setSelectedTask(task)}
      className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
    >
      Schedule
    </button>
  ) : (
    <span className="text-xs text-slate-500">Done</span>
  )}
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</Card>

        </>
      )}

      <Modal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Confirm Maintenance Schedule"
        footer={
          <>
            <button
              onClick={() => setSelectedTask(null)}
              className="rounded-xl border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              onClick={handleSchedule}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm Schedule
            </button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Schedule maintenance for{' '}
              <span className="font-semibold text-white">
                {selectedTask.aircraftId}
              </span>
              ?
            </p>

            <div className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aircraft</span>
                <span className="font-semibold text-white">
                  {selectedTask.aircraftId}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Model</span>
                <span className="text-slate-200">
                  {selectedTask.model}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Failure Risk</span>
                <span className="text-slate-200">
                  {selectedTask.failureRisk.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Predicted RUL</span>
                <span className="text-slate-200">
                  {selectedTask.rul.toFixed(1)} hours
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Action</span>
                <span className="text-right text-slate-200">
                  {selectedTask.action}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Schedule</span>
                <span className="text-slate-200">
                  {selectedTask.schedule}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              This is a hackathon demo. Scheduling changes are stored only in
              the current browser session and are not saved to the backend.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
