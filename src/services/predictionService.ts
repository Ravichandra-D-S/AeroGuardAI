import type { PredictionInput, PredictionResult, RiskLevel } from '@/types/aircraft';

/**
 * Mock prediction function that simulates a risk assessment.
 *
 * This is structured so it can later be replaced by a REST API call to a
 * Python / ML backend. When the backend is ready, swap the body of
 * `predictMaintenanceRisk` for a `fetch()` call to the model endpoint,
 * keeping the same input/output contract.
 *
 * Example future implementation:
 *
 *   export async function predictMaintenanceRisk(
 *     input: PredictionInput,
 *   ): Promise<PredictionResult> {
 *     const res = await fetch(`${API_URL}/predict`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(input),
 *     });
 *     if (!res.ok) throw new Error('Prediction request failed');
 *     return res.json() as Promise<PredictionResult>;
 *   }
 */

function computeRiskScore(input: PredictionInput): number {
  const engineScore = Math.min(input.engineHours / 2500, 1) * 25;
  const tempScore = Math.min(Math.max(input.temperature - 60, 0) / 40, 1) * 25;
  const vibrationScore = Math.min(input.vibration / 1.0, 1) * 20;
  const maintenanceScore = Math.min(input.daysSinceMaintenance / 90, 1) * 15;
  const faultScore = Math.min(input.faultHistory / 3, 1) * 10;
  const fuelScore = Math.min((100 - input.fuelEfficiency) / 40, 1) * 5;

  return Math.round(
    engineScore +
      tempScore +
      vibrationScore +
      maintenanceScore +
      faultScore +
      fuelScore,
  );
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

function recommendationFor(risk: RiskLevel): string {
  switch (risk) {
    case 'Low':
      return 'Routine monitoring — no immediate action required. Continue standard inspection cycle.';
    case 'Medium':
      return 'Schedule maintenance within 7 days. Monitor health parameters closely and prepare service bay.';
    case 'High':
      return 'Immediate inspection required. Ground the aircraft and conduct a full preventive maintenance check.';
  }
}

function buildFactors(input: PredictionInput): { label: string; impact: number }[] {
  return [
    { label: 'Engine Hours', impact: Math.round(Math.min(input.engineHours / 2500, 1) * 100) },
    { label: 'Temperature', impact: Math.round(Math.min(Math.max(input.temperature - 60, 0) / 40, 1) * 100) },
    { label: 'Vibration', impact: Math.round(Math.min(input.vibration / 1.0, 1) * 100) },
    { label: 'Days Since Maintenance', impact: Math.round(Math.min(input.daysSinceMaintenance / 90, 1) * 100) },
    { label: 'Fault History', impact: Math.round(Math.min(input.faultHistory / 3, 1) * 100) },
    { label: 'Fuel Efficiency', impact: Math.round(Math.min((100 - input.fuelEfficiency) / 40, 1) * 100) },
  ];
}

export async function predictMaintenanceRisk(
  input: PredictionInput,
): Promise<PredictionResult> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const score = computeRiskScore(input);
  const riskLevel = riskFromScore(score);

  return {
    riskLevel,
    riskProbability: Math.min(score, 99),
    recommendation: recommendationFor(riskLevel),
    factors: buildFactors(input),
  };
}

export const predictionServiceInfo = {
  status: 'mock',
  description:
    'Currently using a frontend mock. Replace predictMaintenanceRisk() with a REST API call to a Python ML backend when ready.',
  futureEndpoint: 'POST /api/predict',
};
