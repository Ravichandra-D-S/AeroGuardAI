from api.supabase_client import supabase


def get_risk_level(probability):
    """
    Convert failure probability into a risk level.
    """

    if probability >= 0.75:
        return "CRITICAL"

    if probability >= 0.50:
        return "HIGH"

    if probability >= 0.25:
        return "MEDIUM"

    return "LOW"


def get_maintenance_priority(risk_level, rul_hours):
    """
    Determine maintenance priority using both
    risk level and predicted RUL.
    """

    if risk_level == "CRITICAL" or rul_hours < 100:
        return "CRITICAL"

    if risk_level == "HIGH" or rul_hours < 200:
        return "HIGH"

    if risk_level == "MEDIUM" or rul_hours < 300:
        return "MEDIUM"

    return "NORMAL"


def get_fleet_predictions():
    """
    Read stored prediction results from Supabase.
    """

    predictions_response = (
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
            maintenance_priority
            """
        )
        .order("id")
        .execute()
    )

    return predictions_response.data or []


def get_aircraft_models():
    """
    Read aircraft model information from Supabase.
    """

    aircraft_response = (
        supabase
        .table("aircraft")
        .select("aircraft_id, aircraft_model")
        .execute()
    )

    return {
        item["aircraft_id"]: item["aircraft_model"]
        for item in (aircraft_response.data or [])
    }


def generate_predictions():
    """
    Compatibility function used by aircraft.py and alerts.py.

    Returns stored prediction records from Supabase
    in the same general structure expected by those modules.
    """

    predictions = get_fleet_predictions()
    aircraft_models = get_aircraft_models()

    records = []

    for prediction in predictions:
        aircraft_id = prediction["aircraft_id"]

        records.append(
            {
                "record_id": prediction["id"],
                "aircraft_id": aircraft_id,
                "aircraft_model": aircraft_models.get(
                    aircraft_id,
                    "Unknown",
                ),
                "failure_probability": float(
                    prediction["failure_probability"]
                ),
                "failure_probability_percent": float(
                    prediction["failure_probability_percent"]
                ),
                "risk_level": prediction["risk_level"],
                "remaining_useful_life_hours": float(
                    prediction["remaining_useful_life_hours"]
                ),
                "maintenance_priority": prediction[
                    "maintenance_priority"
                ],
            }
        )

    return records


def aggregate_aircraft(records, aircraft_models):
    """
    Convert record-level predictions into one summary
    per aircraft.
    """

    aircraft_groups = {}

    for record in records:
        aircraft_id = record["aircraft_id"]

        if aircraft_id not in aircraft_groups:
            aircraft_groups[aircraft_id] = []

        aircraft_groups[aircraft_id].append(record)

    aircraft_list = []

    for aircraft_id, group in aircraft_groups.items():

        probabilities = [
            float(record["failure_probability"])
            for record in group
        ]

        rul_values = [
            float(record["remaining_useful_life_hours"])
            for record in group
        ]

        average_probability = (
            sum(probabilities) / len(probabilities)
        )

        highest_probability = max(probabilities)

        minimum_rul = min(rul_values)

        risk_level = get_risk_level(
            average_probability
        )

        maintenance_priority = get_maintenance_priority(
            risk_level,
            minimum_rul,
        )

        aircraft_list.append(
            {
                "aircraft_id": aircraft_id,
                "aircraft_model": aircraft_models.get(
                    aircraft_id,
                    "Unknown",
                ),
                "records_analyzed": len(group),
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
        )

    return aircraft_list


def build_fleet_summary(aircraft):
    """
    Build overall fleet statistics.
    """

    total_aircraft = len(aircraft)

    critical = sum(
        1
        for item in aircraft
        if item["risk_level"] == "CRITICAL"
    )

    high = sum(
        1
        for item in aircraft
        if item["risk_level"] == "HIGH"
    )

    medium = sum(
        1
        for item in aircraft
        if item["risk_level"] == "MEDIUM"
    )

    low = sum(
        1
        for item in aircraft
        if item["risk_level"] == "LOW"
    )

    attention_required = critical + high

    rul_values = [
        item["minimum_predicted_rul_hours"]
        for item in aircraft
    ]

    average_rul = (
        sum(rul_values) / len(rul_values)
        if rul_values
        else 0
    )

    return {
        "total_aircraft": total_aircraft,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "attention_required": attention_required,
        "average_predicted_rul_hours": round(
            average_rul,
            1,
        ),
    }


def get_top_risk_aircraft(aircraft, limit=10):
    """
    Return aircraft with the highest average
    failure probability.
    """

    sorted_aircraft = sorted(
        aircraft,
        key=lambda item: (
            item["average_failure_probability_percent"],
            item["highest_failure_probability_percent"],
            -item["minimum_predicted_rul_hours"],
        ),
        reverse=True,
    )

    return sorted_aircraft[:limit]


def get_fleet_summary():
    """
    Main function used by the FastAPI endpoint.
    """

    records = generate_predictions()

    aircraft_models = get_aircraft_models()

    aircraft = aggregate_aircraft(
        records,
        aircraft_models,
    )

    summary = build_fleet_summary(
        aircraft
    )

    top_risk_aircraft = get_top_risk_aircraft(
        aircraft
    )

    return {
        "success": True,
        "summary": summary,
        "top_risk_aircraft": top_risk_aircraft,
        "aircraft": aircraft,
    }