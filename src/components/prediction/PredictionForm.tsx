import { useState } from 'react';
import type { PredictionInput } from '../../types/aircraft';
import { aircraft } from '../../data/aircraftData';

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading?: boolean;
}

const buildDefaultInput = (aircraftId: string): PredictionInput => {
  const selectedAircraft = aircraft.find((item) => item.id === aircraftId);

  if (!selectedAircraft) {
    return {
      aircraftId,
      engineHours: 1900,
      temperature: 88,
      vibration: 0.82,
      fuelEfficiency: 76,
      daysSinceMaintenance: 42,
      faultHistory: 1,

      engineCycles: 2400,
      oilPressure: 48,
      fuelFlow: 820,
      engineRpm: 3200,
      hydraulicPressure: 3000,
      batteryVoltage: 24,
      ambientTemperature: 28,
      aircraftAge: 8,
      maintenanceCount: 12,
      componentWear: 55,
      sensorAnomalies: 2,
      aircraftModel: 'MultiRole-A',
      maintenanceType: 'Preventive',
    };
  }

  return {
    aircraftId: selectedAircraft.id,
    engineHours: selectedAircraft.engineHours,
    temperature: selectedAircraft.temperature,
    vibration: selectedAircraft.vibration,
    fuelEfficiency: selectedAircraft.fuelEfficiency,
    daysSinceMaintenance: selectedAircraft.daysSinceMaintenance,
    faultHistory: selectedAircraft.previousFaults,

    engineCycles: Math.round(selectedAircraft.engineHours * 1.25),
    oilPressure: 48,
    fuelFlow: 820,
    engineRpm: 3200,
    hydraulicPressure: 3000,
    batteryVoltage: 24,
    ambientTemperature: 28,
    aircraftAge: 8,
    maintenanceCount: 12,
    componentWear: 55,
    sensorAnomalies: 2,
    aircraftModel: selectedAircraft.model,
    maintenanceType: 'Preventive',
  };
};

export function PredictionForm({
  onPredict,
  isLoading = false,
}: PredictionFormProps) {
  const [form, setForm] = useState<PredictionInput>(
    buildDefaultInput('A-104'),
  );

  const handleAircraftChange = (aircraftId: string) => {
    setForm(buildDefaultInput(aircraftId));
  };

  const handleNumberChange = (
    field: keyof PredictionInput,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPredict(form);
  };

  const inputClassName =
    'w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

  const selectClassName =
    'w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

  const labelClassName =
    'mb-2 block text-sm font-medium text-slate-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Aircraft */}
      <div>
        <label className={labelClassName}>
          Aircraft
        </label>

        <select
          value={form.aircraftId}
          onChange={(event) =>
            handleAircraftChange(event.target.value)
          }
          className={selectClassName}
          disabled={isLoading}
        >
          {aircraft.map((item) => (
            <option
              key={item.id}
              value={item.id}
              className="bg-slate-900 text-slate-100"
            >
              {item.id} — {item.model}
            </option>
          ))}
        </select>
      </div>

      {/* Main Inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            Engine Hours
          </label>

          <input
            type="number"
            value={form.engineHours}
            onChange={(event) =>
              handleNumberChange(
                'engineHours',
                event.target.value,
              )
            }
            className={inputClassName}
            min="0"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Engine Temperature (°C)
          </label>

          <input
            type="number"
            value={form.temperature}
            onChange={(event) =>
              handleNumberChange(
                'temperature',
                event.target.value,
              )
            }
            className={inputClassName}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Vibration
          </label>

          <input
            type="number"
            step="0.01"
            value={form.vibration}
            onChange={(event) =>
              handleNumberChange(
                'vibration',
                event.target.value,
              )
            }
            className={inputClassName}
            min="0"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Fuel Efficiency (%)
          </label>

          <input
            type="number"
            value={form.fuelEfficiency}
            onChange={(event) =>
              handleNumberChange(
                'fuelEfficiency',
                event.target.value,
              )
            }
            className={inputClassName}
            min="0"
            max="100"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Days Since Maintenance
          </label>

          <input
            type="number"
            value={form.daysSinceMaintenance}
            onChange={(event) =>
              handleNumberChange(
                'daysSinceMaintenance',
                event.target.value,
              )
            }
            className={inputClassName}
            min="0"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Fault History
          </label>

          <input
            type="number"
            value={form.faultHistory}
            onChange={(event) =>
              handleNumberChange(
                'faultHistory',
                event.target.value,
              )
            }
            className={inputClassName}
            min="0"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* AI Prediction Information */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" />

          <p className="font-medium text-slate-100">
            AI Prediction
          </p>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Additional aircraft health parameters are automatically
          populated with synthetic demonstration values for the ML
          model.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? 'Analyzing Aircraft...'
          : 'Predict Maintenance Risk'}
      </button>
    </form>
  );
}