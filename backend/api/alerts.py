from api.supabase_client import supabase


def get_risk_level(probability):
    if probability >= 0.75:
        return "CRITICAL"
    elif probability >= 0.50:
        return "HIGH"
    elif probability >= 0.25:
        return "MEDIUM"
    else:
        return "LOW"


def get_alert_severity(risk_level, rul_hours):
    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"
    elif risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"
    elif risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"
    else:
        return "LOW"


def get_alert_message(risk_level, rul_hours, maintenance_priority):
    if risk_level == "CRITICAL" or rul_hours < 100:
        return "Immediate maintenance inspection required."

    if risk_level == "HIGH" or rul_hours < 200:
        return "Schedule maintenance at the earliest opportunity."

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "Monitor aircraft and plan maintenance."

    if maintenance_priority == "CRITICAL":
        return "Critical maintenance priority detected."

    return "Continue routine monitoring."


def get_maintenance_alerts(limit=20):
    try:
        prediction_response = (
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
            .order("id", desc=True)
            .execute()
        )

        prediction_records = prediction_response.data or []

        if not prediction_records:
            return {
                "success": True,
                "total_alerts": 0,
                "alerts": [],
            }

        aircraft_response = (
            supabase
            .table("aircraft")
            .select(
                """
                aircraft_id,
                aircraft_model
                """
            )
            .execute()
        )

        aircraft_records = aircraft_response.data or []

        aircraft_models = {
            item["aircraft_id"]: item["aircraft_model"]
            for item in aircraft_records
        }

        alerts = []

        for prediction in prediction_records:
            probability = float(
                prediction["failure_probability"]
            )

            probability_percent = float(
                prediction["failure_probability_percent"]
            )

            rul_hours = float(
                prediction["remaining_useful_life_hours"]
            )

            stored_risk_level = prediction.get("risk_level")

            risk_level = (
                stored_risk_level
                if stored_risk_level
                else get_risk_level(probability)
            )

            maintenance_priority = (
                prediction.get("maintenance_priority")
                or "NORMAL"
            )

            severity = get_alert_severity(
                risk_level,
                rul_hours,
            )

            # Only create alerts for aircraft that need attention.
            if severity not in {
                "CRITICAL",
                "HIGH",
                "MEDIUM",
            }:
                continue

            aircraft_id = prediction["aircraft_id"]

            alert = {
                "id": prediction["id"],
                "record_id": prediction["id"],
                "aircraft_id": aircraft_id,
                "aircraft_model": aircraft_models.get(
                    aircraft_id,
                    "Unknown",
                ),
                "severity": severity,
                "risk_level": risk_level,
                "failure_probability": round(
                    probability,
                    3,
                ),
                "failure_probability_percent": round(
                    probability_percent,
                    2,
                ),
                "remaining_useful_life_hours": round(
                    rul_hours,
                    1,
                ),
                "maintenance_priority": maintenance_priority,
                "message": get_alert_message(
                    risk_level,
                    rul_hours,
                    maintenance_priority,
                ),
                "recommendation": (
                    prediction.get("recommendation")
                    or get_alert_message(
                        risk_level,
                        rul_hours,
                        maintenance_priority,
                    )
                ),
                "created_at": prediction.get(
                    "created_at"
                ),
            }

            alerts.append(alert)

        severity_order = {
            "CRITICAL": 0,
            "HIGH": 1,
            "MEDIUM": 2,
            "LOW": 3,
        }

        alerts.sort(
            key=lambda alert: (
                severity_order.get(
                    alert["severity"],
                    99,
                ),
                alert["remaining_useful_life_hours"],
                -alert["failure_probability"],
            )
        )

        return {
            "success": True,
            "total_alerts": len(alerts),
            "alerts": alerts[:limit],
        }

    except Exception as error:
        raise RuntimeError(
            f"Failed to load maintenance alerts from Supabase: {error}"
        ) from error