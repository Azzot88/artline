from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
import uuid

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, Job, AIModel, ProviderConfig, LedgerEntry
from app.schemas import (
    AdminStats, UserWithBalance, CreditGrantRequest,
    ProviderRead, ProviderCreate, ProviderUpdate,
    AIModelRead, AIModelCreate, AIModelUpdate,
    JobRead,
    ModelPerformanceStats
)
from app.domain.billing.service import get_user_balance, add_ledger_entry
from app.domain.providers.service import encrypt_key
from datetime import datetime, timedelta

router = APIRouter()

# Dependency for Admin Check
async def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

# ============================================================================
# STATS (Moved from api_spa.py)
# ============================================================================

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == "running"))).scalar() or 0
    total_credits = (await db.execute(select(func.sum(LedgerEntry.amount)))).scalar() or 0
    
    # Global Performance (24h)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    
    # Avg Time
    q_time = select(func.avg(Job.predict_time))\
        .where(Job.created_at >= one_day_ago)\
        .where(Job.predict_time.is_not(None))
    avg_time = (await db.execute(q_time)).scalar()
    
    # Total Runs (succeeded/failed with cost)
    # Estimate cost = sum(predict_time) * 0.002 (blended rate) or sum(provider_cost) if we had it
    # We will just use a blended rate of $0.002/s (A100 price) for estimation
    q_sum_time = select(func.sum(Job.predict_time))\
        .where(Job.created_at >= one_day_ago)\
        .where(Job.predict_time.is_not(None))
    total_time = (await db.execute(q_sum_time)).scalar() or 0.0
    est_cost = total_time * 0.002
    
    # Breakdown by Type
    # We group by input_type (which is "image" or "video") or maybe we check model type?
    # Job has "kind" or "input_type" ? Checks schemas.py -> JobCreate kind="image"/"video"
    # But Job model has 'type' on AIModel, but Job itself doesn't duplicate it reliably?
    # Actually Job table does NOT have 'kind' column in some versions, spread from JobRequest.
    # Let's check Job model definition in models.py
    # Ah, Job has `kind` (Mapped[str]).
    
    breakdown = {}
    for k in ["image", "video", "audio"]:
        # Count & Avg Time
        q = select(func.count(Job.id), func.avg(Job.predict_time), func.sum(Job.predict_time))\
            .where(Job.kind == k)\
            .where(Job.created_at >= one_day_ago)\
            .where(Job.status == 'succeeded')
            
        res = (await db.execute(q)).first()
        count = res[0] or 0
        avg = res[1] or 0.0
        sum_time = res[2] or 0.0
        
        if count > 0:
            breakdown[k] = {
                "count": count,
                "avg_time": round(avg, 2),
                "cost": round(sum_time * 0.002, 3) 
            }
    
    return AdminStats(
        total_users=total_users,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_credits=total_credits or 0,
        avg_predict_time_24h=round(avg_time, 2) if avg_time else 0.0,
        est_cost_24h=round(est_cost, 2),
        breakdown=breakdown
    )

# ============================================================================
# USERS (Moved from api_spa.py)
# ============================================================================

@router.get("/users", response_model=List[UserWithBalance])
async def list_admin_users(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    res = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = res.scalars().all()
    
    output = []
    for u in users:
        balance = await get_user_balance(db, u.id)
        output.append(UserWithBalance(
            id=u.id,
            email=u.email,
            is_admin=u.is_admin,
            balance=balance,
            created_at=u.created_at
        ))
    return output

@router.post("/users/{user_id}/credits")
async def grant_credits(
    user_id: str,
    req: CreditGrantRequest,
    current_admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    await add_ledger_entry(
        db,
        uid,
        req.amount,
        reason="admin_grant",
        external_id=f"admin_grant_by_{current_admin.id}_{uuid.uuid4()}"
    )
    return {"ok": True}

# ============================================================================
# PROVIDERS CRUD (New)
# ============================================================================

@router.get("/providers", response_model=List[ProviderRead])
async def list_providers(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Note: We return masked keys (implicit in Pydantic schema missing the key field, or we should explicitly ensure it)
    # ProviderRead schema definition has NO api_key field, so it's safe.
    res = await db.execute(select(ProviderConfig).order_by(ProviderConfig.provider_id))
    return res.scalars().all()

@router.post("/providers", response_model=ProviderRead)
async def create_provider(
    req: ProviderCreate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    encrypted = encrypt_key(req.api_key)
    
    # Check exists
    exists = (await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == req.provider_id))).scalar_one_or_none()
    if exists:
         raise HTTPException(status_code=400, detail="Provider ID already exists")

    new_provider = ProviderConfig(
        provider_id=req.provider_id,
        encrypted_api_key=encrypted,
        env_vars=req.env_vars,
        is_active=True
    )
    db.add(new_provider)
    await db.commit()
    await db.refresh(new_provider)
    return new_provider

@router.put("/providers/{provider_id}", response_model=ProviderRead)
async def update_provider(
    provider_id: str,
    req: ProviderUpdate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    p = (await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == provider_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    if req.api_key:
        p.encrypted_api_key = encrypt_key(req.api_key)
    
    if req.env_vars is not None:
        p.env_vars = req.env_vars
        
    if req.is_active is not None:
        p.is_active = req.is_active
        
    await db.commit()
    await db.refresh(p)
    return p

@router.delete("/providers/{provider_id}")
async def delete_provider(
    provider_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    p = (await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == provider_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    await db.delete(p)
    await db.commit()
    return {"ok": True}

# ============================================================================
# MODELS CRUD (New)
# ============================================================================

@router.get("/models", response_model=List[AIModelRead])
async def list_admin_models(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AIModel).order_by(AIModel.created_at.desc()))
    return res.scalars().all()

@router.post("/models", response_model=AIModelRead)
async def create_model(
    req: AIModelCreate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    new_model = AIModel(
        id=uuid.uuid4(),
        # name field does not exist in DB model
        display_name=req.display_name,
        provider=req.provider,
        model_ref=req.model_ref,
        version_id=req.version_id,
        type=req.type,
        credits_per_generation=req.credits_per_generation,
        is_active=req.is_active,
        # is_pro field does not exist in DB model
        cover_image_url=req.cover_image_url,
        capabilities=req.capabilities,
        # Initialize empty configs
        ui_config={},
        normalized_caps_json={},
        cost_config_json={}
    )
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)
    return new_model

@router.get("/models/{model_id}", response_model=AIModelRead)
async def get_model(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uid = uuid.UUID(model_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid UUID")
         
    m = (await db.execute(select(AIModel).where(AIModel.id == uid))).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return m

@router.put("/models/{model_id}", response_model=AIModelRead)
async def update_model(
    model_id: str,
    req: AIModelUpdate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uid = uuid.UUID(model_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid UUID")

    m = (await db.execute(select(AIModel).where(AIModel.id == uid))).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
        
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(m, key, value)
        
    m.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(m)
    return m

@router.delete("/models/{model_id}")
async def delete_model(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uid = uuid.UUID(model_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid UUID")
        
    m = (await db.execute(select(AIModel).where(AIModel.id == uid))).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
        
    await db.delete(m)
    await db.commit()
    return {"ok": True}

# ============================================================================
# REMOTE SCHEMA FETCHING (New)
# ============================================================================

from app.domain.providers.replicate_service import get_replicate_client
from app.schemas import ModelSchemaRequest

@router.post("/fetch-model-schema")
async def fetch_model_schema_endpoint(
    req: ModelSchemaRequest,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Use existing service helper to get client (handles config/decryption)
        service = await get_replicate_client(db)
        
        # Fetch capabilities
        result = service.fetch_model_capabilities(req.model_ref)
        
        # Persist to DB if model exists
        # We try to find the model by ref to update its schema cache
        stmt = select(AIModel).where(AIModel.model_ref == req.model_ref)
        existing_models = (await db.execute(stmt)).scalars().all()
        
        if existing_models:
            for m in existing_models:
                m.raw_schema_json = result.get("raw_response")
                m.normalized_caps_json = result.get("normalized_caps")
                # Also update version_id if available
                latest = result.get("raw_response", {}).get("latest_version", {})
                if latest and "id" in latest:
                    m.version_id = latest["id"]
                    
            await db.commit()
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# REPORTS (New)
# ============================================================================

from sqlalchemy import or_, and_

@router.get("/jobs/broken", response_model=List[JobRead])
async def get_broken_jobs(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100
):
    """
    List jobs that are technically 'broken' (failed or succeeded but missing content).
    This helps admin identify systemic issues or refund candidates.
    """
    stmt = (
        select(Job)
        .where(
            or_(
                Job.status == 'failed',
                and_(
                    Job.status == 'succeeded',
                    or_(Job.result_url.is_(None), Job.result_url == '')
                )
            )
        )
        .order_by(Job.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/models/{model_id}/sync-stats", response_model=ModelPerformanceStats)
async def sync_model_stats(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Syncs performance stats for a model by checking recent jobs.
    Backfills missing predict_time from Replicate API if needed.
    """
    try:
        uid = uuid.UUID(model_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    # 1. Fetch recent jobs
    stmt = select(Job).where(Job.model_id == uid).order_by(Job.created_at.desc()).limit(200)
    jobs = (await db.execute(stmt)).scalars().all()
    
    if not jobs:
        return ModelPerformanceStats()

    service = await get_replicate_client(db)
    
    # 2. Backfill missing metrics
    updated_count = 0
    for job in jobs:
        if job.provider_job_id and job.predict_time is None and job.status in ["succeeded", "failed"]:
            try:
                # Fetch detailed status from Replicate
                details = await service.get_prediction(job.provider_job_id)
                if details and "metrics" in details:
                    metrics = details["metrics"] or {}
                    pt = metrics.get("predict_time")
                    
                    if pt:
                        job.predict_time = float(pt)
                        updated_count += 1
                        
            except Exception as e:
                logger.error(f"Failed to sync job {job.id}: {e}")
                
    if updated_count > 0:
        await db.commit()

    # 3. Calculate Stats
    # Re-fetch to get all data (including older ones stored in DB) to compute accurate stats
    # Actually we can just use SQL for aggregation
    
    now = datetime.utcnow()
    one_day_ago = now - datetime.timedelta(days=1)
    seven_days_ago = now - datetime.timedelta(days=7)
    
    # helper for avg
    async def get_avg_time(since: datetime):
        q = select(func.avg(Job.predict_time), func.count(Job.id))\
            .where(Job.model_id == uid)\
            .where(Job.created_at >= since)\
            .where(Job.predict_time.is_not(None))
        res = (await db.execute(q)).first()
        return res[0] or 0.0, res[1] or 0

    avg_24h, count_24h = await get_avg_time(one_day_ago)
    avg_7d, count_7d = await get_avg_time(seven_days_ago)
    
    # Estimate Cost: Default T4 ($0.00055/s) to A100 ($0.0023/s)
    # This is rough. Ideally we store 'hardware' on the job.
    # We'll use a conservative $0.001/s estimate for now or just return 0 if unknown.
    est_cost = avg_7d * 0.001 

    return ModelPerformanceStats(
        avg_predict_time_24h=round(avg_24h, 2),
        avg_predict_time_7d=round(avg_7d, 2),
        total_runs_24h=count_24h,
        total_runs_7d=count_7d,
        est_cost_per_run=round(est_cost, 4)
    )

@router.post("/stats/sync", response_model=AdminStats)
async def sync_global_stats(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Global Backfill: Checks LAST 100 successful jobs (regardless of model)
    and fetches missing metrics from Replicate.
    """
    # 1. Fetch candidates for backfill
    stmt = (
        select(Job)
        .where(Job.provider_job_id.is_not(None))
        .where(Job.predict_time.is_(None))
        .where(Job.status.in_(['succeeded', 'failed']))
        .order_by(Job.created_at.desc())
        .limit(100) # Process max 100 at a time to avoid timeout
    )
    jobs = (await db.execute(stmt)).scalars().all()
    
    updated_count = 0
    if jobs:
        service = await get_replicate_client(db)
        for job in jobs:
            try:
                # Fetch detailed status
                details = await service.get_prediction(job.provider_job_id)
                if details and "metrics" in details:
                    metrics = details["metrics"] or {}
                    pt = metrics.get("predict_time")
                    
                    if pt:
                        job.predict_time = float(pt)
                        updated_count += 1
            except Exception as e:
                print(f"Global sync failed for job {job.id}: {e}")
                pass
    
    if updated_count > 0:
        await db.commit()
        
    # 2. Return fresh stats (re-use existing logic by calling the function directly?)
    # We can just call the endpoint handler logic, but it needs dependencies.
    # Let's just create a quick internal helper or copy-paste the minimal calc logic.
    # Calling get_admin_stats directly is cleaner if we mock deps, but easier to just Recalc here.
    return await get_admin_stats(user, db)
