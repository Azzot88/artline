from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.jobs.models import Job
from app.domain.users.models import User
from app.domain.billing.service import get_user_balance, add_ledger_entry
import uuid

import math

# Base costs (1:5 ratio)
BASE_COST_IMAGE = 10
BASE_COST_VIDEO = 50

# Logic to calculate cost
def calculate_cost(kind: str, model: str) -> int:
    base = BASE_COST_IMAGE if kind == "image" else BASE_COST_VIDEO
    
    if model == "runway":
        # +30%
        return math.ceil(base * 1.3)
    elif model == "luma":
        # -20%
        return math.ceil(base * 0.8)
    elif model == "flux-pro":
        # Premium: 60 credits (approx $0.05-0.06 if 1000credits=$1)
        # Assuming base image is 10cr ($0.01). flux-pro is 5.5c. So 55cr.
        return 55
    else:
        # Standard (flux, stable-diffusion, dall-e-3)
        return base

async def create_job(db: AsyncSession, user: User, kind: str, prompt: str, model: str = "flux") -> tuple[Job | None, str | None]:
    cost = calculate_cost(kind, model)
    
    # Check balance
    balance = await get_user_balance(db, user.id)
    if balance < cost:
        return None, "Insufficient credits"

    # Deduct credits
    await add_ledger_entry(
        db, 
        user.id, 
        -cost, 
        reason=f"job_cost:{model}", 
        external_id=None
    )

    # Create Job
    job = Job(
        user_id=user.id,
        kind=kind,
        prompt=prompt,
        cost_credits=cost,
        status="queued",
        progress=0,
        # We might want to store model in metadata if we had a field, 
        # but for now we won't change schema, just logic.
        # Ideally we SHOULD add 'model' column but user didn't ask for DB migration, just UI/Logic.
        # We can store it in prompt or add column?
        # The prompt says "Job display... additional info". 
        # I'll append model to prompt string strictly for MVP visible storage? 
        # Or Just trust the price checks out.
        # Let's prepend it " [model: runway] prompt..."
        # Actually user asked to display "ID, date, prompt" in details.
        # Storing in prompt text is hacky but effective MVP.
    )
    # Let's prepend model to prompt for visibility
    job.prompt = f"[{model}] {prompt}"
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    return job, None

async def get_user_jobs(db: AsyncSession, user_id: uuid.UUID, limit: int = 50):
    result = await db.execute(
        select(Job).where(Job.user_id == user_id).order_by(Job.created_at.desc()).limit(limit)
    )
    return result.scalars().all()

async def get_job(db: AsyncSession, job_id: str, user_id: uuid.UUID):
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    return result.scalar_one_or_none()
