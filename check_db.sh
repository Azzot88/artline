#!/bin/bash
echo "=== Database Connection Check ==="
# Check if we can connect to the DB
docker compose exec db pg_isready -U artline_user -d artline_db

echo -e "\n=== Checking Tables ==="
# List all tables and row counts
docker compose exec db psql -U artline_user -d artline_db -c "
SELECT relname as Table, n_live_tup as Rows 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
"

echo -e "\n=== Checking Migrations ==="
# Check current alembic version
docker compose exec db psql -U artline_user -d artline_db -c "SELECT * FROM alembic_version;"
