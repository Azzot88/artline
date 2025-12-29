#!/bin/bash
set -e

# Function to test if postgres is up
postgres_ready() {
    python << END
import sys
import psycopg2
import os

try:
    conn = psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        host=os.environ.get("POSTGRES_SERVER"),
        port=os.environ.get("POSTGRES_PORT", "5432")
    )
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)
END
}

echo "Waiting for Postgres..."
until postgres_ready; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up."

# Check if alembic folder exists
if [ ! -d "/app/app/alembic" ] && [ ! -d "/app/alembic" ]; then
    echo "ERROR: Alembic directory not found in /app/app/alembic or /app/alembic"
    # Failsafe: if we are in dev/local and it's missing, we might want to warn but not crash?
    # But user requirements said 'soft diagnostic' or 'fail with clear message'
    # We will fail if we can't find it because migration attempt will fail anyway.
    # Actually, let's list the directory to be helpful in logs
    ls -R /app
    exit 1
fi

echo "Running migrations..."
# Assuming 'alembic.ini' is at /app/alembic.ini, we run from /app
alembic upgrade head

echo "Starting command: $@"
exec "$@"
