from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "artline_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Celery Beat Schedule for periodic tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'send-verification-reminders': {
        'task': 'send_email_verification_reminders',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10:00 UTC
    },
    'delete-unverified-accounts': {
        'task': 'delete_unverified_accounts',
        'schedule': crontab(hour=2, minute=0),  # Daily at 02:00 UTC
    },
}

# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks([
    "app.tasks.job_runner", 
    "app.domain.jobs.runner",
    "app.tasks.cleanup_tasks"  # Email verification cleanup tasks
])

# Explicit import of runner module to ensure register
# (Sometimes autodiscover needs exact package path or module needs to be importable)
import app.domain.jobs.runner

# Import ALL models to ensure SQLAlchemy registry is populated
# This prevents "InvalidRequestError" when relationships are resolved
# We use the worker_process_init signal to ensure this happens in every child process
from celery.signals import worker_process_init

@worker_process_init.connect
def init_worker_process(**kwargs):
    import app.models
    print("Celery Worker Process Initialized: Models Loaded")

import app.models # Also import in parent for good measure
