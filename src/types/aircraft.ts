export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AircraftStatus = 'Operational' | 'Maintenance';

export type MaintenancePriority = 1 | 2 | 3 | 4;

export type MaintenancePlanStatus = 'Pending' | 'Planned' | 'Completed';

export interface Aircraft {
  id: string;
  status: AircraftStatus;
  engineHours: number;
  temperature: number;
  vibration: number;
  fuelEfficiency: number;
  daysSinceMaintenance: number;
  previousFaults: number;
  riskLevel: RiskLevel;
  riskProbability: number;
  availability: number;
  model: string;
  lastMaintenance: string;
}

export interface MaintenanceTask {
  id: string;
  aircraftId: string;
  riskLevel: RiskLevel;
  priority: MaintenancePriority;
  recommendedAction: string;
  suggestedSchedule: string;
  status: MaintenancePlanStatus;
}

export interface Alert {
  id: string;
  aircraftId: string;
  title: string;
  description: string;
  severity: RiskLevel;
  timestamp: string;
}

export interface PredictionInput {
  aircraftId: string;

  // Existing frontend parameters
  engineHours: number;
  temperature: number;
  vibration: number;
  fuelEfficiency: number;
  daysSinceMaintenance: number;
  faultHistory: number;

  // Additional synthetic parameters required by the ML backend
  engineCycles: number;
  oilPressure: number;
  fuelFlow: number;
  engineRpm: number;
  hydraulicPressure: number;
  batteryVoltage: number;
  ambientTemperature: number;
  aircraftAge: number;
  maintenanceCount: number;
  componentWear: number;
  sensorAnomalies: number;
  aircraftModel: string;
  maintenanceType: string;
}

export interface PredictionResult {
  riskLevel: RiskLevel;
  riskProbability: number;
  remainingUsefulLifeHours: number;
  maintenancePriority: string;
  recommendation: string;
  factors: { label: string; impact: number }[];
}

export type PageId =
  | 'dashboard'
  | 'fleet'
  | 'aircraft-details'
  | 'prediction'
  | 'planner'
  | 'reports';

export interface TrendPoint {
  day: string;
  value: number;
}