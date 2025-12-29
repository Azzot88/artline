# Deployment Guide for ArtLine

This guide covers how to run ArtLine locally with Docker and how to deploy it to a production VPS.

## Prerequisites

- **Docker** & **Docker Compose** plugin installed.
- **Git** (for pulling the repo).

---

## 1. Local Development

Run the stack locally with hot-reloading enabled.

### Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Build and start:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

### Usage
### Usage
- **Web**: [http://localhost](http://localhost) (via Nginx proxy)
- **Docs**: [http://localhost/docs](http://localhost/docs)
- **Logs**: `docker-compose logs -f`

Databases (Postgres & Redis) ports are exposed locally on `5432` and `6379`.
The application is accessed via Nginx on port `80`.

---

## 2. Production Deployment (VPS)

### Server Setup (Ubuntu 22.04+)
1.  **Install Docker**:
    ```bash
    curl -fsSL https://get.docker.com | sh
    ```

2.  **Clone Repository**:
    ```bash
    git clone <your-repo-url> /opt/artline
    cd /opt/artline
    ```

3.  **Configure Environment**:
    ```bash
    cp .env.example .env
    nano .env
    ```
    *Set secure passwords and secrets!*

### Deploying
1.  **Build and Run**:
    ```bash
    docker compose up -d --build
    ```
    *This starts Postgres, Redis, Worker, and the Web app in detached mode.*

2.  **Check Status**:
    ```bash
    docker compose ps
    docker compose logs -f web
    ```

### Updates (Zero-Downtime-ish)
To update the application code:

1.  Pull new changes:
    ```bash
    git pull origin main
    ```
2.  Rebuild and restart only the web/worker services:
    ```bash
    docker compose up -d --build --no-deps web worker
    ```

### maintenance

**Run Migrations Manually** (if needed):
```bash
docker compose exec web alembic upgrade head
```

**Backup Database**:
```bash
docker compose exec db pg_dump -U artline_user artline_db > backup_$(date +%F).sql
```

**Restore Database**:
```bash
cat backup.sql | docker compose exec -T db psql -U artline_user artline_db
```
