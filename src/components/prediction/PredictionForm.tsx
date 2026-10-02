import { useState } from 'react';
import { Brain, Zap } from 'lucide-react';
import type { PredictionInput } from '@/types/aircraft';
import { aircraft } from '@/data/aircraftData';

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  loading: boolean;
}

const inputClass =
  'w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30';

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export function PredictionForm({ onPredict, loading }: PredictionFormProps) {
  const [form, setForm] = useState<PredictionInput>({
    aircraftId: 'A-104',
    engineHours: 1900,
    temperature: 88,
    vibration: 0.82,
    fuelEfficiency: 76,
    daysSinceMaintenance: 42,
    faultHistory: 1,
  });

  const update = (key: keyof PredictionInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict(form);
  };

  const fillFromAircraft = (id: string) => {
    const ac = aircraft.find((a) => a.id === id);
    if (ac) {
      setForm({
        aircraftId: ac.id,
        engineHours: ac.engineHours,
        temperature: ac.temperature,
        vibration: ac.vibration,
        fuelEfficiency: ac.fuelEfficiency,
        daysSinceMaintenance: ac.daysSinceMaintenance,
        faultHistory: ac.previousFaults,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <Brain className="h-5 w-5 text-blue-400" />
        <h3 className="text-base font-semibold text-white">Health Parameters Input</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="aircraftId" className={labelClass}>Aircraft ID</label>
          <select
            id="aircraftId"
            value={form.aircraftId}
            onChange={(e) => {
              update('aircraftId', e.target.value);
              fillFromAircraft(e.target.value);
            }}
            className={inputClass}
          >
            {aircraft.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.model}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">Selecting an aircraft auto-fills its current parameters.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="engineHours" className={labelClass}>Engine Hours</label>
            <input
              id="engineHours"
              type="number"
              min={0}
              max={5000}
              value={form.engineHours}
              onChange={(e) => update('engineHours', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="temperature" className={labelClass}>Temperature (°C)</label>
            <input
              id="temperature"
              type="number"
              min={0}
              max={120}
              value={form.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="vibration" className={labelClass}>Vibration (g)</label>
            <input
              id="vibration"
              type="number"
              step={0.01}
              min={0}
              max={2}
              value={form.vibration}
              onChange={(e) => update('vibration', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="fuelEfficiency" className={labelClass}>Fuel Efficiency (%)</label>
            <input
              id="fuelEfficiency"
              type="number"
              min={0}
              max={100}
              value={form.fuelEfficiency}
              onChange={(e) => update('fuelEfficiency', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="daysSinceMaintenance" className={labelClass}>Days Since Maintenance</label>
            <input
              id="daysSinceMaintenance"
              type="number"
              min={0}
              max={365}
              value={form.daysSinceMaintenance}
              onChange={(e) => update('daysSinceMaintenance', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="faultHistory" className={labelClass}>Fault History (count)</label>
            <input
              id="faultHistory"
              type="number"
              min={0}
              max={10}
              value={form.faultHistory}
              onChange={(e) => update('faultHistory', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          {loading ? 'Predicting...' : 'Predict Maintenance Risk'}
        </button>
      </div>
    </form>
  );
}
