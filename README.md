# ArtLine MVP

Production-usable MVP web application for generating images/video using credits. Built with FastAPI, HTMX, and Postgres.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Stripe Account (Optional, for billing)

### Installation

1. **Clone & Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials if needed
   ```

2. **Start Services**
   ```bash
   docker-compose up --build
   ```
   This will start:
   - `web`: FastAPI app on http://localhost:8000
   - `worker`: Celery worker for background jobs
   - `db`: PostgreSQL
   - `redis`: Task queue broker

3. **Run Migrations**
   On the first run, you need to apply database migrations:
   ```bash
   # Generate migration file
   docker-compose exec web alembic revision --autogenerate -m "Initial tables"
   
   # Apply migration
   docker-compose exec web alembic upgrade head
   ```

### 🧪 Verification / Demo Flow

1. **Access the App**: Go to http://localhost:8000
2. **Sign Up**: Create a new account.
3. **Dashboard**: You will see 0 credits.
4. **Mock Payment**: 
    - Since Stripe keys are likely placeholders, the checkout flow might be mocked or fail.
    - To simulate a top-up manually, access the DB or use the CLI (if added/mocked).
    - *Or simply using the implemented mock in `services/billing.py`, if STRIPE keys are missing, it might just return a success URL loop.*
    - **Easiest Dev Hack**: Connect to DB and give yourself credits:
      ```bash
      docker-compose exec db psql -U artline_user -d artline_db -c "INSERT INTO ledger_entries (user_id, amount, reason, created_at) SELECT id, 1000, 'admin_grant', NOW() FROM users LIMIT 1;"
      ```
5. **Create Job**:
    - Select "Image" or "Video".
    - Type a prompt.
    - Click Generate.
    - Watch the job appear in the list with "Queued" -> "Running" -> "Success".
    - The Balance will update automatically via HTMX.

### 🛠 Development

- **Local Web**: `uvicorn app.main:app --reload` (Needs local env setup)
- **Local Worker**: `celery -A app.tasks.worker worker -l info`
- **Migrations**: `alembic revision --autogenerate -m "msg"` then `alembic upgrade head`

### 💳 Stripe Configuration

To enable real payments:
1. Add `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to `.env`.
2. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:8000/stripe/webhook
   ```

## 🏗 Project Structure

- `app/main.py`: App entry point
- `app/tasks/`: Celery worker and job logic
- `app/templates/`: Jinja2 UI + HTMX partials
- `app/services/`: Business logic (Billing, Credits, Jobs)
- `app/db.py` & `models.py`: Database layer
