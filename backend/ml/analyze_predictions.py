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
# Load data and models
# --------------------------------------------------

df = pd.read_csv(DATA_FILE)

failure_model = joblib.load(FAILURE_MODEL_FILE)
rul_model = joblib.load(RUL_MODEL_FILE)


# --------------------------------------------------
# Features
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
# Predictions
# --------------------------------------------------

X = df[FEATURES]

failure_probability = failure_model.predict_proba(X)[:, 1]
rul_prediction = rul_model.predict(X)


df["predicted_failure_probability"] = failure_probability
df["predicted_rul_hours"] = rul_prediction


# --------------------------------------------------
# Probability statistics
# --------------------------------------------------

print("=" * 65)
print("AEROGUARD AI - PREDICTION ANALYSIS")
print("=" * 65)

print("\nFAILURE PROBABILITY STATISTICS")
print("-" * 65)

print(
    f"Minimum : {failure_probability.min() * 100:.2f}%"
)

print(
    f"Maximum : {failure_probability.max() * 100:.2f}%"
)

print(
    f"Average : {failure_probability.mean() * 100:.2f}%"
)

print(
    f"Median  : {pd.Series(failure_probability).median() * 100:.2f}%"
)


# --------------------------------------------------
# Percentiles
# --------------------------------------------------

percentiles = [10, 25, 50, 75, 90, 95]

print("\nFAILURE PROBABILITY PERCENTILES")
print("-" * 65)

for percentile in percentiles:

    value = (
        pd.Series(failure_probability)
        .quantile(percentile / 100)
    )

    print(
        f"{percentile:>2}th percentile : "
        f"{value * 100:.2f}%"
    )


# --------------------------------------------------
# Probability ranges
# --------------------------------------------------

print("\nFAILURE PROBABILITY RANGES")
print("-" * 65)

ranges = [
    ("0% - 10%", 0.00, 0.10),
    ("10% - 25%", 0.10, 0.25),
    ("25% - 50%", 0.25, 0.50),
    ("50% - 75%", 0.50, 0.75),
    ("75% - 90%", 0.75, 0.90),
    ("90% - 100%", 0.90, 1.01),
]

for label, lower, upper in ranges:

    count = (
        (failure_probability >= lower)
        & (failure_probability < upper)
    ).sum()

    percentage = count / len(df) * 100

    print(
        f"{label:<12} : "
        f"{count:>3} records "
        f"({percentage:>5.1f}%)"
    )


# --------------------------------------------------
# RUL statistics
# --------------------------------------------------

print("\nRUL PREDICTION STATISTICS")
print("-" * 65)

print(
    f"Minimum : {rul_prediction.min():.1f} hours"
)

print(
    f"Maximum : {rul_prediction.max():.1f} hours"
)

print(
    f"Average : {rul_prediction.mean():.1f} hours"
)

print(
    f"Median  : "
    f"{pd.Series(rul_prediction).median():.1f} hours"
)


# --------------------------------------------------
# RUL ranges
# --------------------------------------------------

print("\nRUL RANGES")
print("-" * 65)

rul_ranges = [
    ("0 - 100 hours", 0, 100),
    ("100 - 200 hours", 100, 200),
    ("200 - 300 hours", 200, 300),
    ("300 - 400 hours", 300, 400),
    ("400+ hours", 400, float("inf")),
]

for label, lower, upper in rul_ranges:

    count = (
        (rul_prediction >= lower)
        & (rul_prediction < upper)
    ).sum()

    percentage = count / len(df) * 100

    print(
        f"{label:<18} : "
        f"{count:>3} records "
        f"({percentage:>5.1f}%)"
    )


# --------------------------------------------------
# Highest-risk aircraft
# --------------------------------------------------

print("\nTOP 10 HIGHEST-RISK RECORDS")
print("-" * 65)

top_risk = (
    df.sort_values(
        "predicted_failure_probability",
        ascending=False
    )
    .head(10)
)

for _, row in top_risk.iterrows():

    print(
        f"{row['aircraft_id']} | "
        f"{row['aircraft_model']} | "
        f"Failure: "
        f"{row['predicted_failure_probability'] * 100:.2f}% | "
        f"RUL: "
        f"{row['predicted_rul_hours']:.1f} hours"
    )


print("\n" + "=" * 65)
print("ANALYSIS COMPLETED")
print("=" * 65)