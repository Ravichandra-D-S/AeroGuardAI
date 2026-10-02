import { useState, useEffect } from 'react';
import { Brain, Info, ArrowRight } from 'lucide-react';
import type { PageId, PredictionInput, PredictionResult } from '@/types/aircraft';
import { PredictionForm } from '@/components/prediction/PredictionForm';
import { PredictionResultCard } from '@/components/prediction/PredictionResultCard';
import { Card } from '@/components/ui/Card';
import { predictMaintenanceRisk, predictionServiceInfo } from '@/services/predictionService';
import { getAircraftById } from '@/data/aircraftData';

interface PredictionPageProps {
  presetAircraftId?: string;
  onNavigate: (page: PageId, aircraftId?: string) => void;
}

export function PredictionPage({ presetAircraftId, onNavigate }: PredictionPageProps) {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastInput, setLastInput] = useState<PredictionInput | null>(null);

  useEffect(() => {
    if (presetAircraftId) {
      const ac = getAircraftById(presetAircraftId);
      if (ac) {
        const input: PredictionInput = {
          aircraftId: ac.id,
          engineHours: ac.engineHours,
          temperature: ac.temperature,
          vibration: ac.vibration,
          fuelEfficiency: ac.fuelEfficiency,
          daysSinceMaintenance: ac.daysSinceMaintenance,
          faultHistory: ac.previousFaults,
        };
        handlePredict(input);
      }
    }
  }, [presetAircraftId]);

  const handlePredict = async (input: PredictionInput) => {
    setLoading(true);
    setLastInput(input);
    try {
      const r = await predictMaintenanceRisk(input);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLastInput(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Risk Prediction</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter aircraft health parameters to predict maintenance risk using the AI model
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PredictionForm onPredict={handlePredict} loading={loading} />

        <div className="space-y-4">
          <PredictionResultCard
            result={result}
            loading={loading}
            input={lastInput}
            onReset={handleReset}
          />

          {result && (
            <button
              onClick={() => onNavigate('planner', lastInput?.aircraftId)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500/40 hover:bg-slate-800 hover:text-blue-400"
            >
              Go to Maintenance Planner
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">About the Prediction Engine</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {predictionServiceInfo.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                    Status: {predictionServiceInfo.status}
                  </span>
                  <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                    Future API: {predictionServiceInfo.futureEndpoint}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
