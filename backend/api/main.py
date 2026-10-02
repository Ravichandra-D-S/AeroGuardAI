from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.aircraft import get_aircraft_details
from api.alerts import get_maintenance_alerts
from api.fleet import get_fleet_data
from api.fleet_summary import get_fleet_summary


BASE_DIR = Path(__file__).resolve().parent.parent

FAILURE_MODEL_PATH = BASE_DIR / "models" / "failure_model.pkl"
RUL_MODEL_PATH = BASE_DIR / "models" / "rul_model.pkl"


failure_model = joblib.load(FAILURE_MODEL_PATH)
rul_model = joblib.load(RUL_MODEL_PATH)


app = FastAPI(
    title="AeroGuard AI",
    description="AI-powered aircraft predictive maintenance API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AircraftData(BaseModel):
    flight_hours: float
    engine_cycles: float
    engine_temperature_c: float
    oil_pressure_psi: float
    fuel_flow_kg_hr: float
    vibration_mm_s: float
    engine_rpm: float
    hydraulic_pressure_psi: float
    battery_voltage_v: float
    ambient_temperature_c: float
    aircraft_age_years: float
    last_maintenance_days: float
    maintenance_count: float
    fault_history_count: float
    component_wear_pct: float
    fuel_efficiency_pct: float
    sensor_anomaly_count: float
    aircraft_model: str
    maintenance_type: str


def get_risk_level(probability):
    if probability >= 0.75:
        return "CRITICAL"

    if probability >= 0.50:
        return "HIGH"

    if probability >= 0.25:
        return "MEDIUM"

    return "LOW"


def get_maintenance_priority(risk_level, rul_hours):
    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"

    return "NORMAL"


@app.get("/")
def root():
    return {
        "service": "AeroGuard AI",
        "status": "running",
        "message": "Aircraft predictive maintenance API is running",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "failure_model": "loaded",
        "rul_model": "loaded",
    }


@app.post("/api/predict")
def predict(data: AircraftData):

    input_data = pd.DataFrame(
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

    try:
        failure_probability = float(
            failure_model.predict_proba(input_data)[0][1]
        )

        predicted_rul = float(
            rul_model.predict(input_data)[0]
        )

        predicted_rul = max(predicted_rul, 0)

        risk_level = get_risk_level(
            failure_probability
        )

        maintenance_priority = get_maintenance_priority(
            risk_level,
            predicted_rul,
        )

        return {
            "success": True,
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
                predicted_rul,
                1,
            ),
            "maintenance_priority": maintenance_priority,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {error}",
        ) from error


@app.get("/api/fleet")
def fleet():
    try:
        return get_fleet_data()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Fleet prediction failed: {error}",
        ) from error


@app.get("/api/fleet/summary")
def fleet_summary():
    try:
        return get_fleet_summary()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Fleet summary failed: {error}",
        ) from error


@app.get("/api/alerts")
def alerts():
    try:
        return get_maintenance_alerts()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Maintenance alerts failed: {error}",
        ) from error


@app.get("/api/aircraft/{aircraft_id}")
def aircraft_details(aircraft_id: str):
    try:
        return get_aircraft_details(aircraft_id)

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Aircraft details failed: {error}",
        ) from error