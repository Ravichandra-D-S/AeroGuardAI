import os

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_secret_key = os.getenv("SUPABASE_SECRET_KEY")

if not supabase_url:
    raise ValueError("SUPABASE_URL is missing from backend/.env")

if not supabase_secret_key:
    raise ValueError("SUPABASE_SECRET_KEY is missing from backend/.env")


supabase = create_client(
    supabase_url,
    supabase_secret_key,
)


response = (
    supabase
    .table("aircraft")
    .select("*")
    .limit(1)
    .execute()
)

print("Supabase connection successful.")
print("Existing aircraft records:", len(response.data))