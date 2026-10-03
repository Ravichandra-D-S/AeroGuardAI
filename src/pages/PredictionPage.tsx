import { useState } from 'react';
import { PredictionForm } from '../components/prediction/PredictionForm';
import { PredictionResultCard } from '../components/prediction/PredictionResultCard';
import {
  predictMaintenanceRisk,
  predictionServiceInfo,
} from '../services/predictionService';
import type {
  PredictionInput,
  PredictionResult,
} from '../types/aircraft';

export function PredictionPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (input: PredictionInput) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const result = await predictMaintenanceRisk(input);
      setPrediction(result);
    } catch (err) {
      console.error('Prediction error:', err);

      setError(
        'Unable to connect to the AeroGuard AI prediction service. Make sure the FastAPI backend is running on port 8000.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predictive Maintenance</h1>

        <p className="mt-1 text-sm opacity-70">
          Analyze aircraft health data using the trained AeroGuard AI
          predictive maintenance models.
        </p>
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Prediction Engine:</span>

          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              predictionServiceInfo.status === 'live'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {predictionServiceInfo.status === 'live'
              ? 'LIVE'
              : 'DEMO'}
          </span>
        </div>

        <p className="mt-2 opacity-70">
          {predictionServiceInfo.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-5">
          <PredictionForm
            onPredict={handlePredict}
            isLoading={isLoading}
          />
        </div>

        <div>
          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent" />

                <p className="font-semibold">
                  Analyzing aircraft condition...
                </p>

                <p className="mt-1 text-sm opacity-70">
                  Running failure-risk and remaining-useful-life models.
                </p>
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-300 p-6">
              <h2 className="font-semibold text-red-600">
                Prediction Failed
              </h2>

              <p className="mt-2 text-sm opacity-80">{error}</p>

              <p className="mt-3 text-xs opacity-60">
                Backend endpoint: {predictionServiceInfo.futureEndpoint}
              </p>
            </div>
          )}

          {!isLoading && !error && prediction && (
            <PredictionResultCard result={prediction} />
          )}

          {!isLoading && !error && !prediction && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border p-6">
              <div className="max-w-md text-center">
                <h2 className="font-semibold">
                  Ready for Analysis
                </h2>

                <p className="mt-2 text-sm opacity-70">
                  Enter or review the aircraft health parameters and run a
                  prediction to see failure probability, maintenance
                  priority, and estimated remaining useful life.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-5">
        <h2 className="font-semibold">About the Prediction Engine</h2>

        <p className="mt-2 text-sm opacity-70">
          {predictionServiceInfo.description}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Service Status
            </p>

            <p className="mt-1 font-semibold">
              {predictionServiceInfo.status === 'live'
                ? 'Connected to FastAPI'
                : 'Frontend Demo'}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              API Endpoint
            </p>

            <p className="mt-1 font-mono text-sm">
              {predictionServiceInfo.futureEndpoint}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs opacity-60">
          Synthetic demonstration data is used for this hackathon MVP.
        </p>
      </div>
    </div>
  );
}