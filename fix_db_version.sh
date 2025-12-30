#!/bin/bash
echo "=== Fixing Alembic History ==="
# Delete the missing revision from the database
docker compose exec db psql -U artline_user -d artline_db -c "DELETE FROM alembic_version WHERE version_num = '8dc2ce7545eb';"

echo "=== Current Revision ==="
docker compose exec db psql -U artline_user -d artline_db -c "SELECT * FROM alembic_version;"

echo "=== Restarting Web ==="
docker compose restart web
