import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL environment variable not set.")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    db_version = cur.fetchone()
    print(f"Database connection successful! PostgreSQL version: {db_version[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Database connection failed: {e}")
