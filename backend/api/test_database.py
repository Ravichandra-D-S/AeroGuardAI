from api.supabase_client import supabase


def test_database():

    aircraft = (
        supabase
        .table("aircraft")
        .select("*")
        .limit(5)
        .execute()
    )

    maintenance = (
        supabase
        .table("maintenance_records")
        .select("*")
        .limit(5)
        .execute()
    )

    predictions = (
        supabase
        .table("predictions")
        .select("*")
        .limit(5)
        .execute()
    )

    print("Supabase database connection successful.")

    print(
        "Aircraft records:",
        len(aircraft.data)
    )

    print(
        "Maintenance records:",
        len(maintenance.data)
    )

    print(
        "Prediction records:",
        len(predictions.data)
    )


if __name__ == "__main__":
    test_database()