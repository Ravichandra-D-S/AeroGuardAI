from pathlib import Path

import joblib
import pandas as pd


DATA_FILE = Path("data/aircraft_maintenance_dataset.csv")
FAILURE_MODEL_FILE = Path("models/failure_model.pkl")
RUL_MODEL_FILE = Path("models/rul_model.pkl")


# Load dataset
df = pd.read_csv(DATA_FILE)

# Load trained models
failure_model = joblib.load(FAILURE_MODEL_FILE)
rul_model = joblib.load(RUL_MODEL_FILE)


# Features used during training
features = [
    "flight_hours",
    "engine_cycles",
    "engine_temperature_c",
    "oil_pressure_psi",
    "fuel_flow_kg_hr",
    "vibration_mm_s",
    "engine_rpm",
    "hydraulic_pressure_psi",
    "battery_voltage_v",
    "ambient_temperature_c",
    "aircraft_age_years",
    "last_maintenance_days",
    "maintenance_count",
    "fault_history_count",
    "component_wear_pct",
    "fuel_efficiency_pct",
    "sensor_anomaly_count",
    "aircraft_model",
    "maintenance_type",
]


def get_risk_level(probability):
    if probability >= 0.75:
        return "CRITICAL"
    elif probability >= 0.50:
        return "HIGH"
    elif probability >= 0.25:
        return "MEDIUM"
    else:
        return "LOW"


# Select one aircraft record for testing
test_record = df.iloc[0]

# Create input dataframe
input_data = pd.DataFrame(
    [test_record[features].to_dict()]
)


# Failure prediction
failure_probability = failure_model.predict_proba(input_data)[0][1]

# RUL prediction
rul_prediction = rul_model.predict(input_data)[0]

# Risk level
risk_level = get_risk_level(failure_probability)


print("=" * 60)
print("AEROGUARD AI - MODEL TEST")
print("=" * 60)

print(f"\nAircraft ID        : {test_record['aircraft_id']}")
print(f"Aircraft Model     : {test_record['aircraft_model']}")

print("\n--- FAILURE PREDICTION ---")
print(f"Failure Probability: {failure_probability * 100:.2f}%")
print(f"Risk Level         : {risk_level}")

print("\n--- RUL PREDICTION ---")
print(f"Predicted RUL      : {rul_prediction:.1f} hours")

print("\n--- ACTUAL SYNTHETIC DATA ---")
print(
    f"Actual Failure     : "
    f"{'YES' if test_record['failure_within_30_days'] == 1 else 'NO'}"
)
print(
    f"Reference RUL      : "
    f"{test_record['remaining_useful_life_hours']:.1f} hours"
)
print(
    f"Maintenance Priority: "
    f"{test_record['maintenance_priority']}"
)

print("\n" + "=" * 60)
print("MODEL TEST COMPLETED")
print("=" * 60)