from .fleet_summary import generate_predictions


def get_alert_severity(risk_level, rul_hours):
    """
    Determine alert severity using risk level and
    predicted remaining useful life.
    """

    if risk_level == "CRITICAL" or rul_hours < 50:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 100:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 200:
        return "MEDIUM"

    return "LOW"


def create_alert(record):
    """
    Convert an ML prediction into a maintenance alert.
    """

    risk_level = record["risk_level"]

    rul_hours = record[
        "remaining_useful_life_hours"
    ]

    severity = get_alert_severity(
        risk_level,
        rul_hours,
    )

    if severity == "CRITICAL":
        message = (
            "Immediate maintenance attention required."
        )

    elif severity == "HIGH":
        message = (
            "Maintenance inspection should be scheduled soon."
        )

    elif severity == "MEDIUM":
        message = (
            "Monitor aircraft condition and plan maintenance."
        )

    else:
        message = (
            "Aircraft condition is currently within normal range."
        )

    return {
        "record_id": record["record_id"],
        "aircraft_id": record["aircraft_id"],
        "aircraft_model": record["aircraft_model"],
        "severity": severity,
        "risk_level": risk_level,
        "failure_probability_percent": record[
            "failure_probability_percent"
        ],
        "remaining_useful_life_hours": record[
            "remaining_useful_life_hours"
        ],
        "maintenance_priority": record[
            "maintenance_priority"
        ],
        "message": message,
    }


def get_maintenance_alerts(limit=20):
    """
    Generate maintenance alerts from the ML predictions.

    Alerts are sorted by:
    1. Severity
    2. Failure probability
    3. Remaining useful life
    """

    records = generate_predictions()

    alerts = [
        create_alert(record)
        for record in records
    ]

    severity_rank = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1,
    }

    alerts.sort(
        key=lambda alert: (
            severity_rank[alert["severity"]],
            alert["failure_probability_percent"],
            -alert["remaining_useful_life_hours"],
        ),
        reverse=True,
    )

    return {
        "success": True,
        "total_alerts": len(alerts),
        "alerts": alerts[:limit],
    }