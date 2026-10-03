from pathlib import Path
import sys
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Allow imports from the backend folder when running:
# python -m uvicorn api.main:app --reload --port 8000
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from api.supabase_client import supabase
from api.fleet import get_fleet_data
from api.fleet_summary import get_fleet_summary
from api.alerts import get_maintenance_alerts
from api.aircraft import get_aircraft_details


app = FastAPI(
    title="AeroGuard AI API",
    description="AI-powered predictive maintenance demonstration API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Load trained ML models
# -------------------------------------------------------------------

MODELS_DIR = BACKEND_DIR / "models"

FAILURE_MODEL_PATH = MODELS_DIR / "failure_model.pkl"
RUL_MODEL_PATH = MODELS_DIR / "rul_model.pkl"

try:
    failure_model = joblib.load(FAILURE_MODEL_PATH)
except Exception as exc:
    failure_model = None
    print(f"Warning: Could not load failure model: {exc}")

try:
    rul_model = joblib.load(RUL_MODEL_PATH)
except Exception as exc:
    rul_model = None
    print(f"Warning: Could not load RUL model: {exc}")


# -------------------------------------------------------------------
# Request model
# -------------------------------------------------------------------

class AircraftData(BaseModel):
    # Important: this is the aircraft selected in the frontend.
    aircraft_id: str

    flight_hours: float
    engine_cycles: int
    engine_temperature_c: float
    oil_pressure_psi: float
    fuel_flow_kg_hr: float
    vibration_mm_s: float
    engine_rpm: float
    hydraulic_pressure_psi: float
    battery_voltage_v: float
    ambient_temperature_c: float
    aircraft_age_years: float
    last_maintenance_days: int
    maintenance_count: int
    fault_history_count: int
    component_wear_pct: float
    fuel_efficiency_pct: float
    sensor_anomaly_count: int
    aircraft_model: str
    maintenance_type: str


# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------

def calculate_risk_level(probability: float) -> str:
    if probability < 0.25:
        return "LOW"
    elif probability < 0.50:
        return "MEDIUM"
    elif probability < 0.75:
        return "HIGH"
    else:
        return "CRITICAL"


def calculate_maintenance_priority(
    risk_level: str,
    rul_hours: float,
) -> str:
    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"

    return "NORMAL"


def generate_recommendation(
    risk_level: str,
    rul_hours: float,
    component_wear: float,
    vibration: float,
) -> str:
    if risk_level == "CRITICAL":
        return (
            "Immediate maintenance inspection recommended. "
            "Aircraft should be prioritized for maintenance review."
        )

    if risk_level == "HIGH":
        return (
            "Schedule maintenance inspection soon and closely monitor "
            "high-risk component conditions."
        )

    if rul_hours < 200:
        return (
            "Plan maintenance within the predicted remaining useful life "
            "window and continue condition monitoring."
        )

    if component_wear >= 80:
        return (
            "Component wear is elevated. Schedule a component inspection "
            "and continue monitoring."
        )

    if vibration >= 5:
        return (
            "Vibration level is elevated. Inspect relevant components "
            "during the next maintenance opportunity."
        )

    return "Continue routine monitoring and scheduled maintenance."


def save_prediction_to_supabase(
    aircraft_id: str,
    failure_probability: float,
    failure_probability_percent: float,
    risk_level: str,
    rul_hours: float,
    maintenance_priority: str,
    recommendation: str,
) -> tuple[bool, Optional[str]]:
    """
    Save the newly generated prediction using the aircraft_id selected
    by the frontend.

    Returns:
        (True, None) when saved successfully.
        (False, error_message) when saving fails.
    """

    try:
        prediction_record = {
            "aircraft_id": aircraft_id,
            "failure_probability": failure_probability,
            "failure_probability_percent": failure_probability_percent,
            "risk_level": risk_level,
            "remaining_useful_life_hours": rul_hours,
            "maintenance_priority": maintenance_priority,
            "recommendation": recommendation,
        }

        response = (
            supabase
            .table("predictions")
            .insert(prediction_record)
            .execute()
        )

        if response.data:
            return True, None

        return False, "Supabase did not return the inserted prediction."

    except Exception as exc:
        return False, str(exc)


# -------------------------------------------------------------------
# Root
# -------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "AeroGuard AI API",
        "status": "running",
        "version": "1.0.0",
    }


# -------------------------------------------------------------------
# Health
# -------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "AeroGuard AI",
        "failure_model": "loaded" if failure_model is not None else "not_loaded",
        "rul_model": "loaded" if rul_model is not None else "not_loaded",
        "database": "Supabase",
    }


# -------------------------------------------------------------------
# AI Prediction
# -------------------------------------------------------------------

@app.post("/api/predict")
def predict(data: AircraftData):

    if failure_model is None:
        raise HTTPException(
            status_code=500,
            detail="Failure prediction model is not loaded.",
        )

    if rul_model is None:
        raise HTTPException(
            status_code=500,
            detail="RUL prediction model is not loaded.",
        )

    # ---------------------------------------------------------------
    # Prepare input in exactly the same column order used during
    # model training.
    # ---------------------------------------------------------------

    model_input = pd.DataFrame(
        [
            {
                "flight_hours": data.flight_hours,
                "engine_cycles": data.engine_cycles,
                "engine_temperature_c": data.engine_temperature_c,
                "oil_pressure_psi": data.oil_pressure_psi,
                "fuel_flow_kg_hr": data.fuel_flow_kg_hr,
                "vibration_mm_s": data.vibration_mm_s,
                "engine_rpm": data.engine_rpm,
                "hydraulic_pressure_psi": data.hydraulic_pressure_psi,
                "battery_voltage_v": data.battery_voltage_v,
                "ambient_temperature_c": data.ambient_temperature_c,
                "aircraft_age_years": data.aircraft_age_years,
                "last_maintenance_days": data.last_maintenance_days,
                "maintenance_count": data.maintenance_count,
                "fault_history_count": data.fault_history_count,
                "component_wear_pct": data.component_wear_pct,
                "fuel_efficiency_pct": data.fuel_efficiency_pct,
                "sensor_anomaly_count": data.sensor_anomaly_count,
                "aircraft_model": data.aircraft_model,
                "maintenance_type": data.maintenance_type,
            }
        ]
    )

    # ---------------------------------------------------------------
    # Failure probability
    # ---------------------------------------------------------------

    try:
        failure_probability = float(
            failure_model.predict_proba(model_input)[0][1]
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failure prediction error: {exc}",
        )

    failure_probability = max(0.0, min(1.0, failure_probability))

    failure_probability_percent = failure_probability * 100

    # ---------------------------------------------------------------
    # Remaining Useful Life
    # ---------------------------------------------------------------

    try:
        rul_prediction = float(
            rul_model.predict(model_input)[0]
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"RUL prediction error: {exc}",
        )

    rul_hours = max(0.0, rul_prediction)

    # ---------------------------------------------------------------
    # Risk and maintenance calculations
    # ---------------------------------------------------------------

    risk_level = calculate_risk_level(failure_probability)

    maintenance_priority = calculate_maintenance_priority(
        risk_level,
        rul_hours,
    )

    recommendation = generate_recommendation(
        risk_level,
        rul_hours,
        data.component_wear_pct,
        data.vibration_mm_s,
    )

    # ---------------------------------------------------------------
    # Save prediction to Supabase
    #
    # IMPORTANT:
    # Use data.aircraft_id, NOT aircraft_model.
    # This connects the prediction to AF-101, AF-112, AF-150, etc.
    # ---------------------------------------------------------------

    database_saved, database_error = save_prediction_to_supabase(
        aircraft_id=data.aircraft_id,
        failure_probability=failure_probability,
        failure_probability_percent=failure_probability_percent,
        risk_level=risk_level,
        rul_hours=rul_hours,
        maintenance_priority=maintenance_priority,
        recommendation=recommendation,
    )

    # ---------------------------------------------------------------
    # Response
    # ---------------------------------------------------------------

    return {
        "success": True,

        "aircraft_id": data.aircraft_id,

        "failure_probability": round(failure_probability, 4),

        "failure_probability_percent": round(
            failure_probability_percent,
            2,
        ),

        "risk_level": risk_level,

        "remaining_useful_life_hours": round(
            rul_hours,
            2,
        ),

        "maintenance_priority": maintenance_priority,

        "recommendation": recommendation,

        "database_saved": database_saved,

        "database_error": database_error,
    }


# -------------------------------------------------------------------
# Fleet
# -------------------------------------------------------------------

@app.get("/api/fleet")
def fleet():
    try:
        return get_fleet_data()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load fleet data: {exc}",
        )


# -------------------------------------------------------------------
# Fleet Summary
# -------------------------------------------------------------------

@app.get("/api/fleet/summary")
def fleet_summary():
    try:
        return get_fleet_summary()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load fleet summary: {exc}",
        )


# -------------------------------------------------------------------
# Alerts
# -------------------------------------------------------------------

@app.get("/api/alerts")
def alerts():
    try:
        return get_maintenance_alerts()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load maintenance alerts: {exc}",
        )


# -------------------------------------------------------------------
# Aircraft Details
# -------------------------------------------------------------------

@app.get("/api/aircraft/{aircraft_id}")
def aircraft_details(aircraft_id: str):
    try:
        return get_aircraft_details(aircraft_id)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load aircraft details: {exc}",
        )