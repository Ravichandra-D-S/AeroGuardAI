import random
from pathlib import Path

import numpy as np
import pandas as pd


# Reproducible synthetic dataset
random.seed(42)
np.random.seed(42)

NUM_RECORDS = 500
NUM_AIRCRAFT = 50

OUTPUT_DIR = Path("data")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "aircraft_maintenance_dataset.csv"


aircraft_models = [
    "Fighter-X",
    "Transport-Y",
    "Trainer-Z",
    "MultiRole-A",
    "Cargo-B",
]

maintenance_types = [
    "Routine",
    "Inspection",
    "Corrective",
    "Overhaul",
]


records = []


for i in range(NUM_RECORDS):

    aircraft_number = (i % NUM_AIRCRAFT) + 101
    aircraft_id = f"AF-{aircraft_number}"

    aircraft_model = random.choice(aircraft_models)

    aircraft_age_years = round(
        np.clip(np.random.normal(7, 3), 1, 15), 1
    )

    flight_hours = round(
        np.clip(
            aircraft_age_years * np.random.uniform(250, 450)
            + np.random.normal(0, 120),
            300,
            6000,
        ),
        1,
    )

    engine_cycles = int(
        np.clip(
            flight_hours * np.random.uniform(0.45, 0.60),
            150,
            3500,
        )
    )

    # Maintenance history
    maintenance_count = int(
        np.clip(
            flight_hours / np.random.uniform(350, 500)
            + np.random.normal(0, 2),
            1,
            25,
        )
    )

    last_maintenance_days = int(
        np.clip(
            np.random.normal(55, 35),
            5,
            180,
        )
    )

    fault_history_count = int(
        np.clip(
            np.random.poisson(2),
            0,
            12,
        )
    )

    # Component wear
    component_wear_pct = round(
        np.clip(
            15
            + (flight_hours / 6000) * 65
            + fault_history_count * 1.8
            + np.random.normal(0, 7),
            5,
            98,
        ),
        1,
    )

    # Aircraft environment
    ambient_temperature_c = round(
        np.clip(np.random.normal(30, 7), 15, 48),
        1,
    )

    # Engine health sensors
    engine_temperature_c = round(
        np.clip(
            75
            + component_wear_pct * 0.22
            + ambient_temperature_c * 0.12
            + np.random.normal(0, 4),
            70,
            115,
        ),
        1,
    )

    oil_pressure_psi = round(
        np.clip(
            52
            - component_wear_pct * 0.14
            - fault_history_count * 0.5
            + np.random.normal(0, 2.5),
            28,
            55,
        ),
        1,
    )

    vibration_mm_s = round(
        np.clip(
            1.4
            + component_wear_pct * 0.055
            + fault_history_count * 0.15
            + np.random.normal(0, 0.45),
            0.8,
            10,
        ),
        2,
    )

    engine_rpm = int(
        np.clip(
            np.random.normal(8100, 250)
            + component_wear_pct * 1.5,
            7300,
            8700,
        )
    )

    fuel_flow_kg_hr = round(
        np.clip(
            270
            + component_wear_pct * 0.85
            + np.random.normal(0, 15),
            220,
            380,
        ),
        1,
    )

    hydraulic_pressure_psi = round(
        np.clip(
            3150
            - component_wear_pct * 4.2
            + np.random.normal(0, 70),
            2500,
            3250,
        ),
        1,
    )

    battery_voltage_v = round(
        np.clip(
            28.2
            - component_wear_pct * 0.012
            + np.random.normal(0, 0.25),
            25.5,
            29,
        ),
        2,
    )

    fuel_efficiency_pct = round(
        np.clip(
            98
            - component_wear_pct * 0.20
            + np.random.normal(0, 2),
            70,
            99,
        ),
        1,
    )

    sensor_anomaly_count = int(
        np.clip(
            fault_history_count
            + (component_wear_pct > 65) * random.randint(1, 4)
            + np.random.poisson(0.7),
            0,
            10,
        )
    )

    maintenance_type = random.choices(
        maintenance_types,
        weights=[50, 25, 18, 7],
        k=1,
    )[0]

    # ---------------------------------------------------------
    # Synthetic health score
    # Higher score = greater degradation
    # ---------------------------------------------------------

    degradation_score = (
        component_wear_pct * 0.30
        + vibration_mm_s * 3.5
        + max(0, engine_temperature_c - 90) * 1.2
        + max(0, 45 - oil_pressure_psi) * 2
        + fault_history_count * 2
        + sensor_anomaly_count * 2
        + max(0, last_maintenance_days - 60) * 0.12
    )

    # Convert degradation into probability
    failure_probability = 1 / (
        1 + np.exp(-(degradation_score - 45) / 12)
    )

    failure_probability = float(
        np.clip(
            failure_probability + np.random.normal(0, 0.025),
            0.01,
            0.99,
        )
    )

    # Failure target
    failure_within_30_days = int(
        random.random() < failure_probability
    )

    # Remaining useful life
    remaining_useful_life_hours = (
        650
        - component_wear_pct * 4.7
        - vibration_mm_s * 18
        - fault_history_count * 15
        - sensor_anomaly_count * 12
        - max(0, last_maintenance_days - 60) * 0.8
        + np.random.normal(0, 25)
    )

    remaining_useful_life_hours = round(
        float(
            np.clip(
                remaining_useful_life_hours,
                20,
                700,
            )
        ),
        1,
    )

    # Maintenance priority
    if failure_probability >= 0.75:
        maintenance_priority = "Critical"
    elif failure_probability >= 0.50:
        maintenance_priority = "High"
    elif failure_probability >= 0.25:
        maintenance_priority = "Medium"
    else:
        maintenance_priority = "Normal"

    records.append(
        {
            "record_id": f"REC{i + 1:04d}",
            "aircraft_id": aircraft_id,
            "aircraft_model": aircraft_model,
            "flight_hours": flight_hours,
            "engine_cycles": engine_cycles,
            "engine_temperature_c": engine_temperature_c,
            "oil_pressure_psi": oil_pressure_psi,
            "fuel_flow_kg_hr": fuel_flow_kg_hr,
            "vibration_mm_s": vibration_mm_s,
            "engine_rpm": engine_rpm,
            "hydraulic_pressure_psi": hydraulic_pressure_psi,
            "battery_voltage_v": battery_voltage_v,
            "ambient_temperature_c": ambient_temperature_c,
            "aircraft_age_years": aircraft_age_years,
            "last_maintenance_days": last_maintenance_days,
            "maintenance_count": maintenance_count,
            "fault_history_count": fault_history_count,
            "component_wear_pct": component_wear_pct,
            "fuel_efficiency_pct": fuel_efficiency_pct,
            "sensor_anomaly_count": sensor_anomaly_count,
            "maintenance_type": maintenance_type,
            "failure_within_30_days": failure_within_30_days,
            "failure_probability": round(failure_probability, 3),
            "remaining_useful_life_hours": remaining_useful_life_hours,
            "maintenance_priority": maintenance_priority,
        }
    )


# Create DataFrame
df = pd.DataFrame(records)

# Shuffle records
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Save CSV
df.to_csv(OUTPUT_FILE, index=False)

print("=" * 60)
print("Synthetic aircraft dataset created successfully!")
print("=" * 60)
print(f"Records: {len(df)}")
print(f"Aircraft: {df['aircraft_id'].nunique()}")
print(f"Columns: {len(df.columns)}")
print(f"Output: {OUTPUT_FILE}")
print()

print("Failure distribution:")
print(df["failure_within_30_days"].value_counts())

print()

print("Maintenance priority distribution:")
print(df["maintenance_priority"].value_counts())

print()

print("First 5 records:")
print(df.head())