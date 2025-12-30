#!/bin/bash
echo "=== Docker Compose Status ==="
docker compose ps -a

echo -e "\n=== Web Container Logs ==="
docker compose logs --tail=100 web

echo -e "\n=== Nginx Container Logs ==="
docker compose logs --tail=100 nginx

echo -e "\n=== Worker Container Logs ==="
docker compose logs --tail=50 worker

echo -e "\n=== Database Logs (Errors) ==="
docker compose logs --tail=50 db
