import type {
  PredictionInput,
  PredictionResult,
  RiskLevel,
} from '../types/aircraft';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface BackendPredictionResponse {
  success: boolean;
  failure_probability: number;
  failure_probability_percent: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remaining_useful_life_hours: number;
  maintenance_priority: string;
  recommendation?: string;
  database_saved?: boolean;
  database_error?: string;
}

function mapRiskLevel(
  riskLevel: BackendPredictionResponse['risk_level']
): RiskLevel {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'Critical';

    case 'HIGH':
      return 'High';

    case 'MEDIUM':
      return 'Medium';

    default:
      return 'Low';
  }
}

function getFactorImpact(
  value: number,
  low: number,
  medium: number,
  high: number
): number {
  if (value >= high) {
    return 3;
  }

  if (value >= medium) {
    return 2;
  }

  if (value >= low) {
    return 1;
  }

  return 0;
}

function buildFactors(
  input: PredictionInput,
  failureProbability: number,
  rulHours: number
): { label: string; impact: number }[] {
  return [
    {
      label: 'Component Wear',
      impact: getFactorImpact(
        input.componentWear,
        40,
        60,
        80
      ),
    },
    {
      label: 'Engine Temperature',
      impact: getFactorImpact(
        input.temperature,
        800,
        900,
        950
      ),
    },
    {
      label: 'Vibration',
      impact: getFactorImpact(
        input.vibration,
        3,
        5,
        7
      ),
    },
    {
      label: 'Sensor Anomalies',
      impact: getFactorImpact(
        input.sensorAnomalies,
        1,
        3,
        5
      ),
    },
    {
      label: 'Days Since Maintenance',
      impact: getFactorImpact(
        input.daysSinceMaintenance,
        30,
        60,
        90
      ),
    },
    {
      label: 'Failure Risk',
      impact: getFactorImpact(
        failureProbability,
        0.25,
        0.50,
        0.75
      ),
    },
    {
      label: 'Remaining Useful Life',
      impact:
        rulHours < 100
          ? 3
          : rulHours < 200
            ? 2
            : rulHours < 300
              ? 1
              : 0,
    },
  ];
}

export async function predictMaintenanceRisk(
  input: PredictionInput
): Promise<PredictionResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/predict`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aircraft_id: input.aircraftId,

        flight_hours: input.engineHours,
        engine_cycles: input.engineCycles,
        engine_temperature_c: input.temperature,
        oil_pressure_psi: input.oilPressure,
        fuel_flow_kg_hr: input.fuelFlow,
        vibration_mm_s: input.vibration,
        engine_rpm: input.engineRpm,
        hydraulic_pressure_psi:
          input.hydraulicPressure,
        battery_voltage_v:
          input.batteryVoltage,
        ambient_temperature_c:
          input.ambientTemperature,
        aircraft_age_years:
          input.aircraftAge,
        last_maintenance_days:
          input.daysSinceMaintenance,
        maintenance_count:
          input.maintenanceCount,
        fault_history_count:
          input.faultHistory,
        component_wear_pct:
          input.componentWear,
        fuel_efficiency_pct:
          input.fuelEfficiency,
        sensor_anomaly_count:
          input.sensorAnomalies,
        aircraft_model:
          input.aircraftModel,
        maintenance_type:
          input.maintenanceType,
      }),
    }
  );

  const data =
    (await response.json()) as BackendPredictionResponse & {
      detail?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.detail ||
        'Prediction request failed.'
    );
  }

  if (!data.success) {
    throw new Error(
      'The backend could not generate a prediction.'
    );
  }

  const riskLevel = mapRiskLevel(
    data.risk_level
  );

  const failureProbability =
    Number(data.failure_probability);

  const rulHours =
    Number(
      data.remaining_useful_life_hours
    );

  const recommendation =
    data.recommendation ||
    'Continue routine monitoring.';

  return {
    riskLevel,

    riskProbability:
      failureProbability,

    remainingUsefulLifeHours:
      rulHours,

    maintenancePriority:
      data.maintenance_priority,

    recommendation,

    factors: buildFactors(
      input,
      failureProbability,
      rulHours
    ),
  };
}

export const predictionServiceInfo = {
  status: 'live',

  apiBaseUrl: API_BASE_URL,

  description:
    'Live FastAPI prediction service using trained XGBoost models on synthetic demonstration data.',
};