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

# Determine if we should run migrations
# We only run migrations if the command is starting the web server (gunicorn)
# This prevents workers from clashing or failing if they start before DB is ready
COMMAND="$@"
if [[ "$COMMAND" == *"gunicorn"* ]]; then
    echo "This is the WEB container. Checking for Alembic..."
    
    # Check for Alembic directory at root level /app/alembic
    if [ -d "/app/alembic" ]; then
        echo "Found Alembic directory. Running migrations..."
        alembic upgrade head
    else
        echo "WARNING: /app/alembic not found. Trying /app/app/alembic (legacy path)..."
        if [ -d "/app/app/alembic" ]; then
             echo "Found legacy Alembic path. Running migrations..."
             # We might need to adjust alembic.ini if it expects relative path
             # But assuming alembic command handles it via script_location
             alembic upgrade head
        else
             echo "ERROR: Alembic directory not found in /app/alembic or /app/app/alembic"
             echo "Listing /app content:"
             ls -F /app
             # We fail hard on web container if migrations can't run
             exit 1
        fi
    fi
else
    echo "This is likely a WORKER container (cmd: $COMMAND). Skipping migrations."
fi

echo "Starting command: $@"
exec "$@"
