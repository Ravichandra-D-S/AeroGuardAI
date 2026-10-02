from fastapi import HTTPException

from .fleet_summary import generate_predictions


def get_aircraft_details(aircraft_id):
    """
    Return detailed prediction information for one aircraft.
    """

    records = generate_predictions()

    aircraft_records = [
        record
        for record in records
        if record["aircraft_id"] == aircraft_id
    ]

    if not aircraft_records:
        raise HTTPException(
            status_code=404,
            detail=f"Aircraft {aircraft_id} not found",
        )

    probabilities = [
        record["failure_probability"]
        for record in aircraft_records
    ]

    rul_values = [
        record["remaining_useful_life_hours"]
        for record in aircraft_records
    ]

    average_probability = sum(probabilities) / len(
        probabilities
    )

    highest_probability = max(probabilities)

    minimum_rul = min(rul_values)

    aircraft_model = aircraft_records[0][
        "aircraft_model"
    ]

    risk_levels = [
        record["risk_level"]
        for record in aircraft_records
    ]

    priority_levels = [
        record["maintenance_priority"]
        for record in aircraft_records
    ]

    risk_rank = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4,
    }

    priority_rank = {
        "NORMAL": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4,
    }

    overall_risk = max(
        risk_levels,
        key=lambda level: risk_rank[level],
    )

    overall_priority = max(
        priority_levels,
        key=lambda priority: priority_rank[priority],
    )

    return {
        "success": True,
        "aircraft": {
            "aircraft_id": aircraft_id,
            "aircraft_model": aircraft_model,
            "records_analyzed": len(aircraft_records),
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
            "risk_level": overall_risk,
            "maintenance_priority": overall_priority,
            "records": aircraft_records,
        },
    }