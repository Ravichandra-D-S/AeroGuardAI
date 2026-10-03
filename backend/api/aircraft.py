from api.supabase_client import supabase


def get_aircraft_models():
    response = (
        supabase
        .table("aircraft")
        .select("aircraft_id, aircraft_model")
        .execute()
    )

    return {
        item["aircraft_id"]: item["aircraft_model"]
        for item in (response.data or [])
    }


def get_aircraft_prediction_records(aircraft_id):
    response = (
        supabase
        .table("predictions")
        .select(
            """
            id,
            aircraft_id,
            failure_probability,
            failure_probability_percent,
            risk_level,
            remaining_useful_life_hours,
            maintenance_priority,
            recommendation,
            created_at
            """
        )
        .eq("aircraft_id", aircraft_id)
        .order("id")
        .execute()
    )

    return response.data or []


def get_aircraft_maintenance_records(aircraft_id):
    response = (
        supabase
        .table("maintenance_records")
        .select(
            """
            id,
            aircraft_id,
            flight_hours,
            engine_cycles,
            engine_temperature_c,
            oil_pressure_psi,
            fuel_flow_kg_hr,
            vibration_mm_s,
            engine_rpm,
            hydraulic_pressure_psi,
            battery_voltage_v,
            ambient_temperature_c,
            aircraft_age_years,
            last_maintenance_days,
            maintenance_count,
            fault_history_count,
            component_wear_pct,
            fuel_efficiency_pct,
            sensor_anomaly_count,
            maintenance_type,
            failure_within_30_days,
            created_at
            """
        )
        .eq("aircraft_id", aircraft_id)
        .order("id")
        .execute()
    )

    return response.data or []


def get_aircraft_details(aircraft_id):
    try:
        aircraft_response = (
            supabase
            .table("aircraft")
            .select("aircraft_id, aircraft_model, created_at")
            .eq("aircraft_id", aircraft_id)
            .limit(1)
            .execute()
        )

        aircraft_records = aircraft_response.data or []

        if not aircraft_records:
            return {
                "success": False,
                "message": f"Aircraft {aircraft_id} not found.",
            }

        aircraft = aircraft_records[0]

        prediction_records = get_aircraft_prediction_records(
            aircraft_id
        )

        maintenance_records = get_aircraft_maintenance_records(
            aircraft_id
        )

        if not prediction_records:
            return {
                "success": True,
                "aircraft": {
                    "aircraft_id": aircraft["aircraft_id"],
                    "aircraft_model": aircraft["aircraft_model"],
                    "records_analyzed": 0,
                    "average_failure_probability_percent": 0,
                    "highest_failure_probability_percent": 0,
                    "minimum_predicted_rul_hours": 0,
                    "risk_level": "LOW",
                    "maintenance_priority": "NORMAL",
                },
                "records": [],
                "maintenance_records": maintenance_records,
            }

        probabilities = [
            float(record["failure_probability"])
            for record in prediction_records
        ]

        probability_percentages = [
            float(record["failure_probability_percent"])
            for record in prediction_records
        ]

        rul_values = [
            float(record["remaining_useful_life_hours"])
            for record in prediction_records
        ]

        average_probability = (
            sum(probabilities) / len(probabilities)
        )

        highest_probability = max(probabilities)

        minimum_rul = min(rul_values)

        if average_probability >= 0.75:
            risk_level = "CRITICAL"
        elif average_probability >= 0.50:
            risk_level = "HIGH"
        elif average_probability >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if risk_level == "CRITICAL" or minimum_rul < 100:
            maintenance_priority = "CRITICAL"
        elif risk_level == "HIGH" or minimum_rul < 200:
            maintenance_priority = "HIGH"
        elif risk_level == "MEDIUM" or minimum_rul < 300:
            maintenance_priority = "MEDIUM"
        else:
            maintenance_priority = "NORMAL"

        records = []

        for record in prediction_records:
            records.append(
                {
                    "record_id": record["id"],
                    "aircraft_id": record["aircraft_id"],
                    "failure_probability": float(
                        record["failure_probability"]
                    ),
                    "failure_probability_percent": float(
                        record["failure_probability_percent"]
                    ),
                    "risk_level": record["risk_level"],
                    "remaining_useful_life_hours": float(
                        record["remaining_useful_life_hours"]
                    ),
                    "maintenance_priority": record[
                        "maintenance_priority"
                    ],
                    "recommendation": record.get(
                        "recommendation"
                    ),
                    "created_at": record.get("created_at"),
                }
            )

        aircraft_summary = {
            "aircraft_id": aircraft["aircraft_id"],
            "aircraft_model": aircraft["aircraft_model"],
            "records_analyzed": len(prediction_records),
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

        return {
            "success": True,
            "aircraft": aircraft_summary,
            "records": records,
            "maintenance_records": maintenance_records,
        }

    except Exception as error:
        raise RuntimeError(
            f"Failed to load aircraft details from Supabase: {error}"
        ) from error