from pathlib import Path

import pandas as pd


DATA_FILE = Path("data/aircraft_maintenance_dataset.csv")


df = pd.read_csv(DATA_FILE)


print("=" * 60)
print("AIRCRAFT DATASET INSPECTION")
print("=" * 60)

print(f"Rows: {df.shape[0]}")
print(f"Columns: {df.shape[1]}")

print("\nColumn names:")
for column in df.columns:
    print(f"- {column}")

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate records:")
print(df.duplicated().sum())

print("\nData types:")
print(df.dtypes)

print("\nFailure distribution:")
print(df["failure_within_30_days"].value_counts())

print("\nFailure percentage:")
print(
    df["failure_within_30_days"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)

print("\nMaintenance priority:")
print(df["maintenance_priority"].value_counts())

print("\nNumeric statistics:")
print(
    df.describe().round(2).to_string()
)

print("\nAircraft distribution:")
print(df["aircraft_id"].value_counts().head(10))

print("\nDataset inspection completed.")