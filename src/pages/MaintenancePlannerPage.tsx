import { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarPlus,
  Plane,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageId } from '@/types/aircraft';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Modal } from '@/components/ui/Modal';
import { maintenanceTasks as initialTasks, getAircraftById } from '@/data/aircraftData';
import type { MaintenanceTask } from '@/types/aircraft';

interface PlannerPageProps {
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

interface PriorityCard {
  label: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  count: (tasks: MaintenanceTask[]) => number;
}

const priorityCards: PriorityCard[] = [
  {
    label: 'Immediate',
    icon: Flame,
    accent: 'text-red-400',
    iconBg: 'bg-red-500/10 text-red-400',
    count: (t) => t.filter((x) => x.priority === 1 && x.status !== 'Completed').length,
  },
  {
    label: 'High Priority',
    icon: AlertTriangle,
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-400',
    count: (t) => t.filter((x) => x.priority === 2 && x.status !== 'Completed').length,
  },
  {
    label: 'Medium',
    icon: Clock,
    accent: 'text-blue-400',
    iconBg: 'bg-blue-500/10 text-blue-400',
    count: (t) => t.filter((x) => x.priority === 3 && x.status !== 'Completed').length,
  },
  {
    label: 'Routine',
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    count: (t) => t.filter((x) => x.priority === 4 && x.status !== 'Completed').length,
  },
];

const statusStyles: Record<string, string> = {
  Pending: 'bg-red-500/10 text-red-400 border-red-500/30',
  Planned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

export function MaintenancePlannerPage({ onNavigate }: PlannerPageProps) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(initialTasks);
  const [scheduleModal, setScheduleModal] = useState<MaintenanceTask | null>(null);

  const handleSchedule = () => {
    if (!scheduleModal) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === scheduleModal.id ? { ...t, status: 'Completed' as const } : t,
      ),
    );
    setScheduleModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Planner</h1>
          <p className="mt-1 text-sm text-slate-400">
            Plan and schedule preventive maintenance based on AI risk predictions
          </p>
        </div>
        <button
          onClick={() => onNavigate('prediction')}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-cyan-400"
        >
          <CalendarPlus className="h-4 w-4" />
          Schedule Maintenance
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {priorityCards.map((pc) => {
          const Icon = pc.icon;
          return (
            <div
              key={pc.label}
              className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">{pc.label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${pc.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-2 text-3xl font-bold ${pc.accent}`}>{pc.count(tasks)}</p>
              <p className="mt-0.5 text-xs text-slate-500">tasks pending</p>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Maintenance Schedule</h3>
          <span className="text-xs text-slate-500">{tasks.length} total tasks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Aircraft</th>
                <th className="pb-3 pr-4 font-semibold">Risk Level</th>
                <th className="pb-3 pr-4 font-semibold">Priority</th>
                <th className="pb-3 pr-4 font-semibold">Recommended Action</th>
                <th className="pb-3 pr-4 font-semibold">Suggested Schedule</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const ac = getAircraftById(task.aircraftId);
                return (
                  <tr
                    key={task.id}
                    className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => onNavigate('aircraft-details', task.aircraftId)}
                        className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-blue-400"
                      >
                        <Plane className="h-3.5 w-3.5 text-slate-500" />
                        {task.aircraftId}
                      </button>
                      {ac && <span className="text-xs text-slate-500">{ac.model}</span>}
                    </td>
                    <td className="py-3 pr-4"><RiskBadge level={task.riskLevel} size="sm" /></td>
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
                    <td className="py-3 pr-4 text-slate-300">{task.recommendedAction}</td>
                    <td className="py-3 pr-4 text-slate-400">{task.suggestedSchedule}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-400' : task.status === 'Planned' ? 'bg-blue-400' : 'bg-red-400'}`} />
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {task.status !== 'Completed' ? (
                        <button
                          onClick={() => setScheduleModal(task)}
                          className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                        >
                          Schedule
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title="Confirm Maintenance Schedule"
        footer={
          <>
            <button
              onClick={() => setScheduleModal(null)}
              className="rounded-xl border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-cyan-400"
            >
              Confirm Schedule
            </button>
          </>
        }
      >
        {scheduleModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              You are about to schedule maintenance for{' '}
              <span className="font-semibold text-white">{scheduleModal.aircraftId}</span>.
            </p>
            <div className="space-y-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aircraft</span>
                <span className="font-semibold text-white">{scheduleModal.aircraftId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Action</span>
                <span className="text-slate-200">{scheduleModal.recommendedAction}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Schedule</span>
                <span className="text-slate-200">{scheduleModal.suggestedSchedule}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Priority</span>
                <span className="text-slate-200">Level {scheduleModal.priority}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              The aircraft status will be updated to reflect this scheduled maintenance.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

