import type { PredictionResult, RiskLevel } from '../../types/aircraft';
import { RiskBadge } from '../ui/RiskBadge';

interface PredictionResultCardProps {
  result: PredictionResult;
}

const riskGlow: Record<RiskLevel, string> = {
  Low: 'border-green-300',
  Medium: 'border-yellow-300',
  High: 'border-orange-300',
  Critical: 'border-red-400',
};

const riskAccent: Record<RiskLevel, string> = {
  Low: 'text-green-600',
  Medium: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
};

export function PredictionResultCard({
  result,
}: PredictionResultCardProps) {
  const probabilityPercent = result.riskProbability * 100;

  return (
    <div
      className={`rounded-xl border-2 p-6 ${riskGlow[result.riskLevel]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-60">Predicted Failure Risk</p>

          <h2
            className={`mt-1 text-3xl font-bold ${riskAccent[result.riskLevel]}`}
          >
            {result.riskProbability >= 0
              ? `${probabilityPercent.toFixed(1)}%`
              : 'N/A'}
          </h2>
        </div>

        <RiskBadge level={result.riskLevel} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">
            Risk Level
          </p>

          <p
            className={`mt-1 font-semibold ${riskAccent[result.riskLevel]}`}
          >
            {result.riskLevel}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">
            Maintenance Priority
          </p>

          <p className="mt-1 font-semibold">
            {result.maintenancePriority}
          </p>
        </div>

        <div className="rounded-lg border p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide opacity-60">
            Remaining Useful Life
          </p>

          <p className="mt-1 text-2xl font-bold">
            {result.remainingUsefulLifeHours.toFixed(1)} hours
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <p className="text-sm font-semibold">Recommended Action</p>

        <p className="mt-2 text-sm opacity-80">
          {result.recommendation}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Contributing Indicators</p>

        <div className="mt-3 space-y-3">
          {result.factors.map((factor) => (
            <div key={factor.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{factor.label}</span>
                <span>{factor.impact.toFixed(0)}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-current"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, factor.impact),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-xs opacity-50">
        Prediction generated using synthetic demonstration data and the
        trained AeroGuard AI ML models.
      </p>
    </div>
  );
}