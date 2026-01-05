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

# Auto-discover tasks in the tasks module
# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks(["app.tasks.job_runner", "app.domain.jobs.runner"])

# Explicit import of runner module to ensure register
# (Sometimes autodiscover needs exact package path or module needs to be importable)
import app.domain.jobs.runner
