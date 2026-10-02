from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "aircraft_maintenance_dataset.csv"
FAILURE_MODEL_PATH = BASE_DIR / "models" / "failure_model.pkl"
RUL_MODEL_PATH = BASE_DIR / "models" / "rul_model.pkl"


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


def get_risk_level(probability):
    """
    Convert failure probability into a risk level.
    """

    if probability >= 0.75:
        return "CRITICAL"

    if probability >= 0.50:
        return "HIGH"

    if probability >= 0.25:
        return "MEDIUM"

    return "LOW"


def get_maintenance_priority(risk_level, rul_hours):
    """
    Determine maintenance priority using both
    risk level and predicted RUL.
    """

    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"

    return "NORMAL"


def load_models():
    """
    Load the trained ML models.
    """

    failure_model = joblib.load(FAILURE_MODEL_PATH)
    rul_model = joblib.load(RUL_MODEL_PATH)

    return failure_model, rul_model


def generate_predictions():
    """
    Generate ML predictions for every maintenance record.
    """

    df = pd.read_csv(DATA_PATH)

    failure_model, rul_model = load_models()

    X = df[FEATURES]

    failure_probabilities = failure_model.predict_proba(X)[:, 1]

    rul_predictions = rul_model.predict(X)

    records = []

    for index, row in df.iterrows():

        failure_probability = float(failure_probabilities[index])

        rul_hours = max(float(rul_predictions[index]), 0)

        risk_level = get_risk_level(failure_probability)

        maintenance_priority = get_maintenance_priority(
            risk_level,
            rul_hours,
        )

        records.append(
            {
                "record_id": row["record_id"],
                "aircraft_id": row["aircraft_id"],
                "aircraft_model": row["aircraft_model"],
                "failure_probability": round(
                    failure_probability,
                    4,
                ),
                "failure_probability_percent": round(
                    failure_probability * 100,
                    2,
                ),
                "risk_level": risk_level,
                "remaining_useful_life_hours": round(
                    rul_hours,
                    1,
                ),
                "maintenance_priority": maintenance_priority,
                "flight_hours": row["flight_hours"],
                "component_wear_pct": row["component_wear_pct"],
                "vibration_mm_s": row["vibration_mm_s"],
                "engine_temperature_c": row["engine_temperature_c"],
                "last_maintenance_days": row[
                    "last_maintenance_days"
                ],
            }
        )

    return records


def get_priority_rank(priority):
    """
    Convert maintenance priority into a numeric severity rank.
    """

    priority_ranks = {
        "NORMAL": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4,
    }

    return priority_ranks.get(priority, 1)


def aggregate_aircraft(records):
    """
    Convert record-level predictions into one summary
    per aircraft.

    There are 500 maintenance records and 50 aircraft,
    so each aircraft will have multiple records.
    """

    records_df = pd.DataFrame(records)

    aircraft_list = []

    for aircraft_id, group in records_df.groupby("aircraft_id"):

        average_probability = group[
            "failure_probability"
        ].mean()

        highest_probability = group[
            "failure_probability"
        ].max()

        minimum_rul = group[
            "remaining_useful_life_hours"
        ].min()

        # Aircraft-level risk is based on the
        # average predicted failure probability.
        risk_level = get_risk_level(
            average_probability
        )

        # Maintenance priority considers the aircraft's
        # overall risk and its minimum predicted RUL.
        maintenance_priority = get_maintenance_priority(
            risk_level,
            minimum_rul,
        )

        aircraft_model = group[
            "aircraft_model"
        ].iloc[0]

        aircraft_list.append(
            {
                "aircraft_id": aircraft_id,
                "aircraft_model": aircraft_model,
                "records_analyzed": len(group),
                "average_failure_probability_percent": round(
                    average_probability * 100,
                    2,
                ),
                "highest_failure_probability_percent": round(
                    highest_probability * 100,
                    2,
                ),
                "minimum_predicted_rul_hours": round(
                    minimum_rul,
                    1,
                ),
                "risk_level": risk_level,
                "maintenance_priority": maintenance_priority,
            }
        )

    return aircraft_list


def build_fleet_summary(aircraft):
    """
    Build overall fleet statistics.
    """

    total_aircraft = len(aircraft)

    critical = sum(
        1
        for item in aircraft
        if item["risk_level"] == "CRITICAL"
    )

    high = sum(
        1
        for item in aircraft
        if item["risk_level"] == "HIGH"
    )

    medium = sum(
        1
        for item in aircraft
        if item["risk_level"] == "MEDIUM"
    )

    low = sum(
        1
        for item in aircraft
        if item["risk_level"] == "LOW"
    )

    attention_required = critical + high

    rul_values = [
        item["minimum_predicted_rul_hours"]
        for item in aircraft
    ]

    average_rul = (
        sum(rul_values) / len(rul_values)
        if rul_values
        else 0
    )

    return {
        "total_aircraft": total_aircraft,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "attention_required": attention_required,
        "average_predicted_rul_hours": round(
            average_rul,
            1,
        ),
    }


def get_top_risk_aircraft(aircraft, limit=10):
    """
    Return the aircraft with the highest average
    failure probability.

    Highest individual probability and lowest RUL
    are used as secondary sorting criteria.
    """

    sorted_aircraft = sorted(
        aircraft,
        key=lambda item: (
            item["average_failure_probability_percent"],
            item["highest_failure_probability_percent"],
            -item["minimum_predicted_rul_hours"],
        ),
        reverse=True,
    )

    return sorted_aircraft[:limit]


def get_fleet_summary():
    """
    Main function used by the FastAPI endpoint.
    """

    records = generate_predictions()

    aircraft = aggregate_aircraft(records)

    summary = build_fleet_summary(aircraft)

    top_risk_aircraft = get_top_risk_aircraft(
        aircraft
    )

    return {
        "success": True,
        "summary": summary,
        "top_risk_aircraft": top_risk_aircraft,
        "aircraft": aircraft,
    }