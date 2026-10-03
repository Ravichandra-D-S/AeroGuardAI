from api.supabase_client import supabase


def get_fleet_data():
    """
    Get fleet prediction data from Supabase.

    Supabase tables used:
    - aircraft
    - predictions
    """

    try:
        # --------------------------------------------------
        # Get aircraft information
        # --------------------------------------------------

        aircraft_response = (
            supabase
            .table("aircraft")
            .select("aircraft_id, aircraft_model")
            .execute()
        )

        aircraft_records = aircraft_response.data or []

        aircraft_models = {
            item["aircraft_id"]: item["aircraft_model"]
            for item in aircraft_records
        }

        # --------------------------------------------------
        # Get stored ML predictions
        # --------------------------------------------------

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

        prediction_records = predictions_response.data or []

        # --------------------------------------------------
        # Build frontend-compatible fleet records
        # --------------------------------------------------

        fleet_records = []

        for prediction in prediction_records:
            aircraft_id = prediction["aircraft_id"]

            fleet_records.append(
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

        return fleet_records

    except Exception as error:
        raise RuntimeError(
            f"Failed to load fleet data from Supabase: {error}"
        ) from error