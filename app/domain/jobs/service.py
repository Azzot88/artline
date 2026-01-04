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

import json

async def create_job(
    db: AsyncSession, 
    user: User | object, # GuestProfile
    kind: str, 
    prompt: str, 
    model: str = "flux",
    params: dict = None
) -> tuple[Job | None, str | None]:
    
    # Determine if user or guest
    is_guest = not isinstance(user, User)
    
    cost = calculate_cost(kind, model)
    
    # Check balance
    if is_guest:
        balance = user.balance
    else:
        balance = await get_user_balance(db, user.id)
        
    if balance < cost:
        return None, "Insufficient credits"

    # Deduct credits
    if is_guest:
        user.balance -= cost
        # Guest ledger not strictly required, balance field is source of truth
    else:
        await add_ledger_entry(
            db, 
            user.id, 
            -cost, 
            reason=f"job_cost:{model}", 
            external_id=None
        )

    # Create Job
    job = Job(
        kind=kind,
        cost_credits=cost,
        status="queued",
        progress=0,
        owner_type="guest" if is_guest else "user"
    )
    
    if is_guest:
        job.guest_id = user.id
        from datetime import datetime, timedelta
        # Set expiry for guest jobs
        job.expires_at = datetime.utcnow() + timedelta(days=15)
    else:
        job.user_id = user.id
    
    # Serialize structure: [model_id] <json> | prompt
    # If params exist, dump them.
    params_str = ""
    if params:
        try:
            params_str = json.dumps(params or {})
        except:
             pass
    
    if params_str:
        job.prompt = f"[{model}] {params_str} | {prompt}"
    else:
        job.prompt = f"[{model}] {prompt}"
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    return job, None

async def get_user_jobs(db: AsyncSession, user: User | object, limit: int = 50):
    # Determine if guest
    is_guest = not isinstance(user, User)
    
    stmt = select(Job).order_by(Job.created_at.desc()).limit(limit)
    
    if is_guest:
        stmt = stmt.where(Job.guest_id == user.id)
    else:
        stmt = stmt.where(Job.user_id == user.id)
        
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_job(db: AsyncSession, job_id: str, user_id: uuid.UUID):
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    return result.scalar_one_or_none()
