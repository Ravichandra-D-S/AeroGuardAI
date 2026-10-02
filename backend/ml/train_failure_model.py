from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier


# ============================================================
# 1. Paths
# ============================================================

DATA_FILE = Path("data/aircraft_maintenance_dataset.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODEL_DIR / "failure_model.pkl"


# ============================================================
# 2. Load dataset
# ============================================================

df = pd.read_csv(DATA_FILE)

print("=" * 60)
print("AIRCRAFT FAILURE PREDICTION MODEL")
print("=" * 60)

print(f"Dataset shape: {df.shape}")


# ============================================================
# 3. Select features
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


target = "failure_within_30_days"


X = df[features]
y = df[target]


# ============================================================
# 4. Identify feature types
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
# 6. Create XGBoost model
# ============================================================

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    random_state=42,
    eval_metric="logloss",
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
    stratify=y,
)


print(f"\nTraining records: {len(X_train)}")
print(f"Testing records: {len(X_test)}")


# ============================================================
# 8. Train model
# ============================================================

print("\nTraining XGBoost model...")

pipeline.fit(X_train, y_train)

print("Training completed.")


# ============================================================
# 9. Predictions
# ============================================================

y_pred = pipeline.predict(X_test)

y_probability = pipeline.predict_proba(X_test)[:, 1]


# ============================================================
# 10. Evaluation
# ============================================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0,
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0,
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0,
)

roc_auc = roc_auc_score(
    y_test,
    y_probability,
)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")


# ============================================================
# 11. Classification report
# ============================================================

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "No Failure",
            "Failure",
        ],
        zero_division=0,
    )
)


# ============================================================
# 12. Confusion matrix
# ============================================================

print("Confusion Matrix:")

cm = confusion_matrix(y_test, y_pred)

print(cm)


# ============================================================
# 13. Save model
# ============================================================

joblib.dump(
    pipeline,
    MODEL_FILE,
)

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(f"Model file: {MODEL_FILE}")