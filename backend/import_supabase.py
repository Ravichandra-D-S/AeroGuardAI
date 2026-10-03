import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from backend/.env")

if not SUPABASE_SECRET_KEY:
    raise ValueError("SUPABASE_SECRET_KEY is missing from backend/.env")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)

CSV_PATH = "data/aircraft_maintenance_dataset.csv"

df = pd.read_csv(CSV_PATH)

print(f"CSV records found: {len(df)}")


# ============================================================
# SAFETY CHECK
# ============================================================

aircraft_existing = (
    supabase
    .table("aircraft")
    .select("aircraft_id")
    .limit(1)
    .execute()
)

maintenance_existing = (
    supabase
    .table("maintenance_records")
    .select("id")
    .limit(1)
    .execute()
)

predictions_existing = (
    supabase
    .table("predictions")
    .select("id")
    .limit(1)
    .execute()
)

if aircraft_existing.data:
    raise RuntimeError(
        "The aircraft table already contains data. "
        "Import stopped to prevent duplicates."
    )

if maintenance_existing.data:
    raise RuntimeError(
        "The maintenance_records table already contains data. "
        "Import stopped to prevent duplicates."
    )

if predictions_existing.data:
    raise RuntimeError(
        "The predictions table already contains data. "
        "Import stopped to prevent duplicates."
    )


# ============================================================
# 1. AIRCRAFT TABLE
# ============================================================

aircraft_columns = [
    "aircraft_id",
    "aircraft_model",
]

aircraft_df = (
    df[aircraft_columns]
    .drop_duplicates(subset=["aircraft_id"])
    .copy()
)

aircraft_records = aircraft_df.to_dict(orient="records")

print(f"Unique aircraft found: {len(aircraft_records)}")


if aircraft_records:
    response = (
        supabase
        .table("aircraft")
        .insert(aircraft_records)
        .execute()
    )

    print(f"Aircraft imported: {len(response.data)}")


# ============================================================
# 2. MAINTENANCE RECORDS TABLE
# ============================================================

maintenance_columns = [
    "aircraft_id",
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
    "maintenance_type",
    "failure_within_30_days",
]

maintenance_df = df[maintenance_columns].copy()

maintenance_df = maintenance_df.astype(object).where(
    pd.notna(maintenance_df),
    None,
)

maintenance_records = maintenance_df.to_dict(orient="records")

print(f"Maintenance records found: {len(maintenance_records)}")


BATCH_SIZE = 100
maintenance_total = 0

for start in range(0, len(maintenance_records), BATCH_SIZE):

    batch = maintenance_records[
        start:start + BATCH_SIZE
    ]

    response = (
        supabase
        .table("maintenance_records")
        .insert(batch)
        .execute()
    )

    inserted = len(response.data)
    maintenance_total += inserted

    print(
        f"Maintenance batch "
        f"{start + 1}-{start + len(batch)}: "
        f"{inserted} records"
    )


# ============================================================
# 3. PREDICTIONS TABLE
# ============================================================

def get_risk_level(probability):
    if probability < 0.25:
        return "LOW"
    elif probability < 0.50:
        return "MEDIUM"
    elif probability < 0.75:
        return "HIGH"
    else:
        return "CRITICAL"


def get_recommendation(risk_level, rul):
    if risk_level == "CRITICAL" or rul < 100:
        return "Immediate maintenance inspection required."
    elif risk_level == "HIGH" or rul < 200:
        return "Schedule maintenance at the earliest opportunity."
    elif risk_level == "MEDIUM" or rul < 300:
        return "Monitor aircraft and plan maintenance."
    else:
        return "Continue routine monitoring."


prediction_records = []

for _, row in df.iterrows():

    probability = float(row["failure_probability"])
    rul = float(row["remaining_useful_life_hours"])

    risk_level = get_risk_level(probability)

    recommendation = get_recommendation(
        risk_level,
        rul,
    )

    # Convert probability to percentage
    if probability <= 1:
        probability_percent = probability * 100
    else:
        probability_percent = probability

    prediction_records.append({
        "aircraft_id": str(row["aircraft_id"]),
        "failure_probability": probability,
        "failure_probability_percent": probability_percent,
        "risk_level": risk_level,
        "remaining_useful_life_hours": rul,
        "maintenance_priority": str(
            row["maintenance_priority"]
        ),
        "recommendation": recommendation,
    })


print(f"Prediction records found: {len(prediction_records)}")


prediction_total = 0

for start in range(0, len(prediction_records), BATCH_SIZE):

    batch = prediction_records[
        start:start + BATCH_SIZE
    ]

    response = (
        supabase
        .table("predictions")
        .insert(batch)
        .execute()
    )

    inserted = len(response.data)
    prediction_total += inserted

    print(
        f"Prediction batch "
        f"{start + 1}-{start + len(batch)}: "
        f"{inserted} records"
    )


# ============================================================
# FINAL RESULT
# ============================================================

print()
print("=" * 60)
print("SUPABASE IMPORT COMPLETED SUCCESSFULLY")
print("=" * 60)
print(f"Aircraft records:       {len(aircraft_records)}")
print(f"Maintenance records:   {maintenance_total}")
print(f"Prediction records:     {prediction_total}")
print("=" * 60)