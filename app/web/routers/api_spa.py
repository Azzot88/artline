from datetime import timedelta
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, delete
import uuid

from app.core.db import get_db
from app.core.config import settings
from app.core.deps import get_current_user_optional, get_current_user
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.i18n import get_t
from app.models import User, Job, AIModel, ProviderConfig, LedgerEntry
from app.schemas import UserContext, JobRead, JobRequestSPA, UserRead, UserCreate, AdminStats, UserWithBalance, CreditGrantRequest
from app.domain.billing.service import get_user_balance, add_ledger_entry
from app.domain.jobs.service import create_job, get_user_jobs, get_public_jobs, get_review_jobs, delete_job, like_job, get_job_with_permission
from app.domain.jobs.runner import process_job
from app.domain.users.guest_service import get_or_create_guest
import boto3
import asyncio
from botocore.exceptions import ClientError

router = APIRouter()

# SPA Auth Schemas (Internal)
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class GuestInitResponse(BaseModel):
    guest_id: str
    balance: int




@router.post("/auth/login")
async def spa_login(
    creds: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == creds.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Set Cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=18000,
        samesite="lax",
        secure=False 
    )
    return {"ok": True, "user": UserRead.model_validate(user)}

@router.post("/auth/logout")
async def spa_logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}

@router.post("/auth/register")
async def spa_register(
    creds: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # 1. Check existing
    result = await db.execute(select(User).where(User.email == creds.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create user
    hashed_pw = get_password_hash(creds.password)
    new_user = User(email=creds.email, hashed_password=hashed_pw)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 3. Guest Migration
    guest_id_cookie = request.cookies.get("guest_id")
    if guest_id_cookie:
        try:
            gid = uuid.UUID(guest_id_cookie)
            # Update jobs: set user_id, owner_type='user', clear guest_id, clear expires_at
            stmt = (
                update(Job)
                .where(Job.guest_id == gid)
                .values(
                    user_id=new_user.id,
                    owner_type="user",
                    guest_id=None,
                    expires_at=None
                )
            )
            await db.execute(stmt)
            await db.commit()
        except ValueError:
            pass

    # 4. Auto-login
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False 
    )
    return {"ok": True, "user": UserRead.model_validate(new_user)}

@router.post("/auth/guest/init", response_model=GuestInitResponse)
async def spa_guest_init(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Check if already has cookie
    guest_id_cookie = request.cookies.get("guest_id")
    gid = None
    if guest_id_cookie:
        try:
            gid = uuid.UUID(guest_id_cookie)
        except ValueError:
            pass
            
    guest = await get_or_create_guest(db, gid)
    
    # Set cookie for 1 year
    response.set_cookie(
        key="guest_id",
        value=str(guest.id),
        max_age=31536000,
        httponly=True,
        samesite="lax",
        secure=False 
    )
    
    return GuestInitResponse(guest_id=str(guest.id), balance=guest.balance)


@router.get("/me", response_model=UserContext)
async def get_me(
    request: Request,
    response: Response,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Bootstrap endpoint for SPA. Returns auth context and balance.
    Ensures guest ID exists if no user is logged in.
    """
    if isinstance(user, User):
        balance = await get_user_balance(db, user.id)
        return UserContext(
            user=UserRead.model_validate(user), 
            is_guest=False,
            balance=balance,
            guest_id=None
        )
    
    # Guest Handling
    # If 'user' is already a GuestProfile object (from dependency), reuse it
    guest = None
    if isinstance(user, object) and not isinstance(user, User) and hasattr(user, 'id'):
         guest = user
    
    if not guest:
        # Fallback or explicity create if dependency returned None (e.g. no cookie)
        guest_id_cookie = request.cookies.get("guest_id")
        gid = None
        if guest_id_cookie:
            try:
                gid = uuid.UUID(guest_id_cookie)
            except ValueError:
                pass
                
        guest = await get_or_create_guest(db, gid)
    
    # Always refresh/set cookie
    response.set_cookie(
        key="guest_id",
        value=str(guest.id),
        max_age=31536000,
        httponly=True,
        samesite="lax",
        secure=False 
    )
    
    return UserContext(
        user=None,
        is_guest=True,
        balance=guest.balance,
        guest_id=str(guest.id)
    )

@router.get("/jobs", response_model=list[JobRead])
async def list_jobs(
    request: Request,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    # Handle Guest Fallback
    if not user:
        guest_id_cookie = request.cookies.get("guest_id")
        if guest_id_cookie:
            try:
                gid = uuid.UUID(guest_id_cookie)
                # We do NOT create on list, only fetch. If invalid, return empty.
                from app.domain.users.guest_service import get_guest
                user = await get_guest(db, gid)
            except ValueError:
                pass
    
    if not user:
        return []

    return await get_user_jobs(db, user, limit)

@router.get("/gallery", response_model=list[JobRead])
async def gallery_jobs(
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    return await get_public_jobs(db, limit, offset)

@router.get("/admin/review", response_model=list[JobRead])
async def admin_review_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return await get_review_jobs(db, limit, offset)

@router.post("/jobs", response_model=JobRead)
async def create_spa_job(
    req: JobRequestSPA,
    response: Response,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        # If API accessed without cookie (e.g. Curl), we technically should error 401?
        # But SPA should have cookie. If cookie missing, Depends returns None.
        # But wait, middleware sets cookie. So request from browser ALWAYS has guest_id.
        # If curl without cookie -> User is None.
        raise HTTPException(status_code=401, detail="Authentication required (Cookie)")

    # Guest Cookie Persistence: 
    # If a new guest was created during dependency resolution (invalid cookie etc), 
    # we MUST update the client's cookie.
    if not isinstance(user, User):
         # It's a guest
         response.set_cookie(
            key="guest_id",
            value=str(user.id),
            max_age=31536000,
            httponly=True,
            samesite="lax",
            secure=False 
         )

    # 1. Validate Model
    try:
        model_uuid = uuid.UUID(req.model_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model ID")
        
    res = await db.execute(select(AIModel).where(AIModel.id == model_uuid))
    model = res.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 2. Create Job
    job, error = await create_job(db, user, req.kind, req.prompt, req.model_id, req.params)
    
    if error:
        code = "insufficient_credits" if "credits" in error else "validation_error"
        print(f"DEBUG: Job Creation Failed: {code} - {error}", flush=True)
        raise HTTPException(status_code=400, detail={"code": code, "message": error})
        
    process_job.delay(job.id)
    return job

@router.get("/jobs/{job_id}", response_model=JobRead)
async def get_job_status(
    request: Request,
    job_id: str,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Handle Guest Fallback (same as list_jobs)
    if not user:
        guest_id_cookie = request.cookies.get("guest_id")
        if guest_id_cookie:
            try:
                gid = uuid.UUID(guest_id_cookie)
                from app.domain.users.guest_service import get_guest
                user = await get_guest(db, gid)
            except ValueError:
                pass

    if not user:
         raise HTTPException(status_code=401, detail="Unauthorized")

    job = await get_job_with_permission(db, job_id, user)
    
    if not job:
        # Debug: Check if job exists at all?
        j_check = await db.execute(select(Job.guest_id).where(Job.id == job_id))
        j_real = j_check.scalar_one_or_none()
        print(f"DEBUG: Real Job GuestID={j_real} vs UserID={user.id if hasattr(user, 'id') else 'None'}", flush=True)
        raise HTTPException(status_code=404, detail="Job not found")

    # Sync Logic: If job is running and is Replicate, maybe fetch live logs?
    if job.status == "running" and job.provider == "replicate" and job.provider_job_id:
         # We limit this to once every few seconds? 
         # Or rely on frontend polling rate (2s) which is fine.
         # Ideally we should cache this result for 1-2s in Redis to avoid spamming Replicate if multiple tabs open.
         # For now, direct call (MVP).
         try:
             # We need ReplicateService
             # Re-use dependency injection or manual init?
             # get_replicate_client needs db session.
             from app.domain.providers.replicate_service import get_replicate_client
             service = await get_replicate_client(db)
             
             pred = await service.get_prediction(job.provider_job_id)
             if pred:
                 # Update logs and progress
                 job.logs = pred.get("logs")
                 
                 # Optional: Auto-detect completion if webhook failed?
                 if pred["status"] == "succeeded" and job.status != "succeeded":
                     # We could finish it here, but let's stick to logs only for safe read-only
                     pass
                     
                 # Update DB with logs so they persist
                 # (Optional: might be heavy on write DB if logs are huge? Text is fine).
                 await db.commit()
         except Exception as e:
             # Ignore transient errors during polling
             pass
    
    return job

@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    success = await delete_job(db, job_id, user)
    
    if not success:
         raise HTTPException(status_code=404, detail="Job not found")
         
    # We still need to trigger S3 deletion in background, but we need the result_url which was on the job
    # The service method mutates the job object but it's attached to session? 
    # Actually service method refreshes or we need to fetch before?
    # service.delete_job fetches the job. 
    # Optimally, service.delete_job should return the old s3_url or handle the deletion itself via a callback?
    # For now, let's just stick to DB update in service. 
    # Re-Design: service should handle side effects or return them.
    # To keep it simple: Let's assume service handles DB state. background S3 is fine if we miss it (orphan file).
    # But clean is better. 
    # Re-implementing delete_job in router to use service implies service does everything. 
    # Service returned bool. 
    
    return {"ok": True}

# Renamed to strictly imply background usage (synchronous wrapper for boto3)
def delete_s3_object_bg(key: str):
    if not settings.AWS_ACCESS_KEY_ID:
        return
    try:
        print(f"DEBUG: Deleting S3 Object: {key}")
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=key)
    except Exception as e:
        print(f"ERROR: Failed to delete S3 object {key}: {e}")

# Removed async wrapper as we use BackgroundTasks which runs in threadpool for sync functions
# (FastAPI handles it if def is not async)


@router.get("/jobs/{job_id}/download")
async def download_job(
    request: Request,
    job_id: str,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Handle Guest Fallback
    if not user:
        guest_id_cookie = request.cookies.get("guest_id")
        if guest_id_cookie:
            try:
                gid = uuid.UUID(guest_id_cookie)
                from app.domain.users.guest_service import get_guest
                user = await get_guest(db, gid)
            except ValueError:
                pass

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(Job).where(Job.id == job_id)
    if isinstance(user, User):
        stmt = stmt.where(Job.user_id == user.id)
    else:
        stmt = stmt.where(Job.guest_id == user.id)
        
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job or not job.result_url:
         raise HTTPException(status_code=404, detail="File not found")

    # Generate Presigned URL
    try:
        # Extract Ext
        ext = job.result_url.split('.')[-1]
        filename = f"artline-{job_id[:8]}.{ext}"
        
        # Parse Key
        from urllib.parse import urlparse
        key = urlparse(job.result_url).path.lstrip('/')
        
        url = generate_presigned_url(key, filename)
        return {"url": url}
    except Exception as e:
        print(f"Presign Error: {e}")
        # Fallback to direct URL if presign fails
        return {"url": job.result_url}

def generate_presigned_url(key: str, filename: str):
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    return s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': settings.AWS_BUCKET_NAME,
            'Key': key,
            'ResponseContentDisposition': f'attachment; filename="{filename}"'
        },
        ExpiresIn=3600
    )

@router.post("/jobs/{job_id}/public")
async def toggle_public(
    job_id: str,
    user: User = Depends(get_current_user), # Strict User
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).where(Job.id == job_id, Job.user_id == user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.is_public = not job.is_public
    await db.commit()
    return {"is_public": job.is_public}

@router.post("/jobs/{job_id}/curate")
async def toggle_curated(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.is_curated = not job.is_curated
    # If curating, ensure it is also public so it shows in gallery
    if job.is_curated:
        job.is_public = True
        
    await db.commit()
    return {"is_curated": job.is_curated, "is_public": job.is_public}

@router.post("/jobs/{job_id}/like")
async def like_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    likes = await like_job(db, job_id)
    return {"likes": likes}

from app.domain.catalog.service import CatalogService
from app.domain.catalog.schemas import ModelUISpec

@router.get("/models/{model_id}/ui-spec", response_model=ModelUISpec)
async def get_model_ui_spec(
    model_id: str,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Model
    try:
         mid = uuid.UUID(model_id)
         stmt = select(AIModel).where(AIModel.id == mid)
         res = await db.execute(stmt)
         model = res.scalar_one_or_none()
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid UUID")
         
    if not model:
         raise HTTPException(status_code=404, detail="Model not found")

    # 2. Determine User Tier
    # (MVP: Everyone is 'starter' unless 'pro' flag or subscription logic exists)
    # Since we don't have subscription tables yet, we'll check a simple flag or default.
    user_tier = "starter"
    if isinstance(user, User):
        # Check explicit admin flag or future subscription
        if user.is_admin:
            user_tier = "admin" # See everything
        # else if user.subscription_plan...
        
    # 3. Resolve Spec
    catalog_service = CatalogService()
    return catalog_service.resolve_ui_spec(model, user_tier)


@router.get("/models")
async def list_models(db: AsyncSession = Depends(get_db)):
    # Reuse logic roughly or query directly
    # Ideally standard formatted JSON
    res = await db.execute(select(AIModel).where(AIModel.is_active == True))
    models = res.scalars().all()
    
    data = []
    for m in models:
         data.append({
             "id": str(m.id),
             "name": m.display_name,
             "description": m.description,
             "provider": m.provider,
             "cover_image": m.cover_image_url,
             "inputs": m.normalized_caps_json.get("inputs", []) if m.normalized_caps_json else [],
             "defaults": m.normalized_caps_json.get("defaults", {}) if m.normalized_caps_json else {},
             "credits": m.credits_per_generation,
             "capabilities": m.capabilities or [],
             "ui_config": m.ui_config or {}
         })
    return data



@router.put("/users/me")
async def update_profile(
    req: RegisterRequest, # Reusing simple email/pass schema for now, or create dedicated UpdateSchema
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Simple profile update (password only for MVP)
    if req.password:
        user.hashed_password = get_password_hash(req.password)
        await db.commit()
    return {"ok": True}
