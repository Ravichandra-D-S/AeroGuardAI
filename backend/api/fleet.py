from pathlib import Path

import joblib
import pandas as pd


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_FILE = BASE_DIR / "data" / "aircraft_maintenance_dataset.csv"
FAILURE_MODEL_FILE = BASE_DIR / "models" / "failure_model.pkl"
RUL_MODEL_FILE = BASE_DIR / "models" / "rul_model.pkl"


# --------------------------------------------------
# Load dataset and models
# --------------------------------------------------

df = pd.read_csv(DATA_FILE)

failure_model = joblib.load(FAILURE_MODEL_FILE)
rul_model = joblib.load(RUL_MODEL_FILE)


# --------------------------------------------------
# Features used by the ML models
# --------------------------------------------------

FEATURES = [
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


# --------------------------------------------------
# Helper functions
# --------------------------------------------------

def get_risk_level(probability: float) -> str:
    if probability >= 0.75:
        return "CRITICAL"
    elif probability >= 0.50:
        return "HIGH"
    elif probability >= 0.25:
        return "MEDIUM"
    else:
        return "LOW"


def get_maintenance_priority(
    risk_level: str,
    rul_hours: float
) -> str:

    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"

    return "NORMAL"


# --------------------------------------------------
# Generate fleet predictions
# --------------------------------------------------

def generate_fleet_predictions():

    input_data = df[FEATURES].copy()

    # Predict failure probability
    failure_probabilities = failure_model.predict_proba(
        input_data
    )[:, 1]

    # Predict RUL
    rul_predictions = rul_model.predict(
        input_data
    )

    results = []

    for index, row in df.iterrows():

        probability = float(
            failure_probabilities[index]
        )

        rul = max(
            0.0,
            float(rul_predictions[index])
        )

        risk_level = get_risk_level(
            probability
        )

        maintenance_priority = get_maintenance_priority(
            risk_level,
            rul
        )

        results.append(
            {
                "record_id": row["record_id"],
                "aircraft_id": row["aircraft_id"],
                "aircraft_model": row["aircraft_model"],
                "failure_probability": round(
                    probability,
                    4
                ),
                "failure_probability_percent": round(
                    probability * 100,
                    2
                ),
                "risk_level": risk_level,
                "remaining_useful_life_hours": round(
                    rul,
                    1
                ),
                "maintenance_priority": maintenance_priority,
            }
        )

    return results


# --------------------------------------------------
# Fleet summary
# --------------------------------------------------

def get_fleet_summary(predictions):

    total_records = len(predictions)

    critical = sum(
        1
        for item in predictions
        if item["risk_level"] == "CRITICAL"
    )

    high = sum(
        1
        for item in predictions
        if item["risk_level"] == "HIGH"
    )

    medium = sum(
        1
        for item in predictions
        if item["risk_level"] == "MEDIUM"
    )

    low = sum(
        1
        for item in predictions
        if item["risk_level"] == "LOW"
    )

    average_rul = sum(
        item["remaining_useful_life_hours"]
        for item in predictions
    ) / total_records

    return {
        "total_records": total_records,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "average_predicted_rul_hours": round(
            average_rul,
            1
        ),
    }


# --------------------------------------------------
# Main fleet function
# --------------------------------------------------

def get_fleet_data():

    predictions = generate_fleet_predictions()

    summary = get_fleet_summary(
        predictions
    )

    return {
        "success": True,
        "summary": summary,
        "aircraft": predictions,
    }