from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor


# ============================================================
# 1. Paths
# ============================================================

DATA_FILE = Path("data/aircraft_maintenance_dataset.csv")
MODEL_DIR = Path("models")

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODEL_DIR / "rul_model.pkl"


# ============================================================
# 2. Load dataset
# ============================================================

df = pd.read_csv(DATA_FILE)

print("=" * 60)
print("AIRCRAFT REMAINING USEFUL LIFE MODEL")
print("=" * 60)

print(f"Dataset shape: {df.shape}")


# ============================================================
# 3. Features
# ============================================================

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


target = "remaining_useful_life_hours"


X = df[features]
y = df[target]


# ============================================================
# 4. Feature types
# ============================================================

numeric_features = [
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
]


categorical_features = [
    "aircraft_model",
    "maintenance_type",
]


# ============================================================
# 5. Preprocessing
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features,
        )
    ],
    remainder="passthrough",
)


# ============================================================
# 6. XGBoost regression model
# ============================================================

model = XGBRegressor(
    n_estimators=250,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    random_state=42,
    objective="reg:squarederror",
)


pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# ============================================================
# 7. Train/test split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)


print(f"\nTraining records: {len(X_train)}")
print(f"Testing records: {len(X_test)}")


# ============================================================
# 8. Train
# ============================================================

print("\nTraining XGBoost RUL model...")

pipeline.fit(X_train, y_train)

print("Training completed.")


# ============================================================
# 9. Prediction
# ============================================================

y_pred = pipeline.predict(X_test)


# ============================================================
# 10. Evaluation
# ============================================================

mae = mean_absolute_error(
    y_test,
    y_pred,
)

rmse = mean_squared_error(
    y_test,
    y_pred,
) ** 0.5

r2 = r2_score(
    y_test,
    y_pred,
)


print("\n" + "=" * 60)
print("RUL MODEL PERFORMANCE")
print("=" * 60)

print(f"MAE : {mae:.2f} hours")
print(f"RMSE: {rmse:.2f} hours")
print(f"R²  : {r2:.4f}")


# ============================================================
# 11. Example predictions
# ============================================================

results = X_test.copy()

results["actual_rul_hours"] = y_test.values
results["predicted_rul_hours"] = y_pred

print("\nExample RUL predictions:")

print(
    results[
        [
            "actual_rul_hours",
            "predicted_rul_hours",
        ]
    ]
    .head(10)
    .round(1)
    .to_string(index=False)
)


# ============================================================
# 12. Save model
# ============================================================

joblib.dump(
    pipeline,
    MODEL_FILE,
)


print("\n" + "=" * 60)
print("RUL MODEL SAVED")
print("=" * 60)

print(f"Model file: {MODEL_FILE}")