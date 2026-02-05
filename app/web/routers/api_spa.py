from datetime import timedelta
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, delete
import uuid

from app.core.db import get_db
from app.core.config import settings
from app.core.deps import get_current_user_optional, get_current_user
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.i18n import get_t
from app.models import User, Job, AIModel, ProviderConfig, LedgerEntry
from app.schemas import (
    UserContext, JobRead, JobRequestSPA, UserRead, UserCreate, 
    AdminStats, UserWithBalance, CreditGrantRequest, JobPrivacyUpdate,
    EmailVerificationSendRequest, EmailVerificationCodeRequest, EmailVerificationStatus
)
from app.domain.billing.service import get_user_balance, add_ledger_entry
from app.domain.jobs.service import create_job, get_user_jobs, get_public_jobs, get_review_jobs, delete_job, like_job, get_job_with_permission, get_admin_feed
from app.domain.jobs.runner import process_job
from app.domain.users.guest_service import get_or_create_guest
from app.domain.analytics.service import AnalyticsService
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
    request: Request,
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
    
    await AnalyticsService.log_activity(db, "login", user_id=user.id, request=request) 
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
    db: AsyncSession = Depends(get_db),
    language: str = Query("ru")
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
    
    # 5. Send verification email automatically
    from app.domain.users import verification_service
    email_sent = False
    try:
        success, error = await verification_service.send_verification_code(db, new_user, language=language)
        email_sent = success
    except Exception as e:
        print(f"Failed to send verification email on registration: {e}")
    
    await AnalyticsService.log_activity(db, "register", user_id=new_user.id, request=request)
    return {
        "ok": True, 
        "user": UserRead.model_validate(new_user),
        "email_verification_sent": email_sent
    }

# Email Verification Endpoints
@router.post("/auth/email/send-code")
async def send_email_verification_code(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    language: str = Query("ru")
):
    """Send/resend verification code to user's email"""
    from app.domain.users import verification_service
    
    success, error = await verification_service.send_verification_code(db, user, language=language)
    
    if not success:
        raise HTTPException(status_code=400, detail=error)
    
    return {"ok": True, "message": "Verification code sent"}


@router.post("/auth/email/verify")
async def verify_email_code(
    req: EmailVerificationCodeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify email with 6-digit code"""
    from app.domain.users import verification_service
    
    success, error = await verification_service.verify_code(db, user, req.code)
    
    if not success:
        raise HTTPException(status_code=400, detail=error)
    
    return {
        "ok": True, 
        "message": "Email verified successfully",
        "user": UserRead.model_validate(user)
    }


@router.get("/auth/email/status", response_model=EmailVerificationStatus)
async def get_email_verification_status(
    user: User = Depends(get_current_user)
):
    """Get current email verification status"""
    from app.domain.users import verification_service
    
    return await verification_service.check_verification_status(user)


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

@router.get("/admin/feed", response_model=list[JobRead])
async def admin_feed_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 30,
    offset: int = 0
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return await get_admin_feed(db, limit, offset)

@router.post("/jobs", response_model=JobRead)
async def create_spa_job(
    req: JobRequestSPA,
    request: Request,
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
    
    real_user_id = user.id if isinstance(user, User) else None
    # If it's not a User but acts like one (Guest), we rely on cookie (handled inside log_activity) 
    # OR we pass it explicitly if we have the object.
    # Actually log_activity extracts guest_id from cookie if None. 
    # But if we have a guest object 'user', we can pass its ID as guest_id explicitly if we want?
    # Let's just fix the user_id passing.
    
    await AnalyticsService.log_activity(
        db, 
        "generate", 
        details={"job_id": str(job.id), "model_id": req.model_id, "kind": req.kind},
        user_id=real_user_id,
        request=request 
    )
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
async def remove_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    success, deleted_url = await delete_job(db, job_id, user)
    
    if not success:
         raise HTTPException(status_code=404, detail="Job not found")
         
    # Trigger S3 deletion in background
    if deleted_url:
        from urllib.parse import urlparse
        try:
            # Extract key from URL
            # format: https://bucket.s3.region.amazonaws.com/path/to/key
            path = urlparse(deleted_url).path.lstrip('/')
            if path:
                background_tasks.add_task(archive_s3_object_bg, path)
        except Exception as e:
            print(f"Error parsing S3 URL for deletion: {e}")
    
    return {"ok": True}

# Renamed to strictly imply background usage (synchronous wrapper for boto3)
def archive_s3_object_bg(key: str):
    if not settings.AWS_ACCESS_KEY_ID:
        return
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        # Archiving Logic: Move to 'deleted/' prefix
        # 1. Copy
        source = {'Bucket': settings.AWS_BUCKET_NAME, 'Key': key}
        dest_key = f"deleted/{key}"
        print(f"DEBUG: Archiving S3 Object: {key} -> {dest_key}")
        
        s3.copy_object(CopySource=source, Bucket=settings.AWS_BUCKET_NAME, Key=dest_key)
        
        # 2. Delete Original
        s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=key)
        
    except ClientError as e:
         # If 404, maybe already deleted?
         if e.response['Error']['Code'] == "404":
             print(f"WARN: S3 Object {key} not found for archiving")
         else:
             print(f"ERROR: Failed to archive S3 object {key}: {e}")
    except Exception as e:
        print(f"ERROR: Failed to archive S3 object {key}: {e}")

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

@router.patch("/jobs/{job_id}/privacy")
async def update_job_privacy(
    job_id: str,
    body: JobPrivacyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).where(Job.id == job_id, Job.user_id == user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    # If not found for user, check if admin (for future compatibility, though strictly modifying OWN privacy usually implies ownership)
    # Requirement: "Users cannot make image public themselves". Only admins.
    
    if not job:
        # If admin tries to modify another's job?
        if user.is_admin:
             stmt = select(Job).where(Job.id == job_id)
             result = await db.execute(stmt)
             job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

    # Access Control Logic
    # 'private' -> Stealth Mode (is_private=True, hidden from admin list typically)
    # 'public' -> Gallery Mode (is_public=True)
    # 'standard' (or implicity disabling private) -> Standard Mode (Visible to admin)
    
    if body.visibility == "public":
        if not user.is_admin:
            raise HTTPException(status_code=403, detail="Only admins can publish images")
        job.is_public = True
        job.is_private = False
        
    elif body.visibility == "private":
        job.is_public = False
        job.is_private = True
        
    elif body.visibility == "standard" or body.visibility == "unlisted":
         # Reset to default
        job.is_public = False
        job.is_private = False
        
    # Validation for frontend 'hidden' legacy if passed during transition, map to private
    elif body.visibility == "hidden":
        job.is_public = False
        job.is_private = True

    else:
        raise HTTPException(status_code=400, detail="Invalid visibility status")

    await db.commit()
    return {"ok": True, "visibility": body.visibility, "is_public": job.is_public, "is_private": job.is_private}

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
async def toggle_like(
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
    # Fetch active models
    res = await db.execute(select(AIModel).where(AIModel.is_active == True))
    models = res.scalars().all()
    
    # Use CatalogService to resolve authoritative parameters
    from app.domain.catalog.service import CatalogService
    catalog_service = CatalogService()
    
    data = []
    for m in models:
         # Resolve full spec (assuming 'starter' tier for public list)
         spec = catalog_service.resolve_ui_spec(m, user_tier="starter")
         
         # Map spec.parameters to legacy 'inputs' format for frontend compatibility
         inputs = []
         for p in spec.parameters:
             inputs.append({
                 "name": p.id,
                 "type": p.type,
                 "description": p.description,
                 "default": p.default,
                 "required": p.required,
                 "min": p.min,
                 "max": p.max,
                 "enum": [opt.value for opt in p.options] if p.options else None,
                 "ui_group": p.group_id
             })

         # Extract defaults map
         defaults = {p.id: p.default for p in spec.parameters if p.default is not None}

         data.append({
             "id": str(m.id),
             "name": m.display_name,
             "description": m.description,
             "provider": m.provider,
             "cover_image": m.cover_image_url,
             "inputs": inputs, # Authoritative inputs from CatalogService
             "defaults": defaults,
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


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Hard delete a user and all their data (jobs, ledger, etc).
    Also archives their S3 files to 'deleted/'.
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    res = await db.execute(select(User).where(User.id == uid))
    target_user = res.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent deleting self
    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    try:
        # Get jobs to archive S3 files
        jobs_res = await db.execute(select(Job).where(Job.user_id == uid))
        jobs = jobs_res.scalars().all()
        
        s3_keys = []
        for j in jobs:
            if j.result_url:
                try:
                    path = urlparse(j.result_url).path.lstrip('/')
                    if path:
                        s3_keys.append(path)
                except:
                    pass
        
        # S3 Cleanup (Sync in thread)
        if s3_keys and settings.AWS_ACCESS_KEY_ID:
             import threading
             def archive_batch(keys):
                 for key in keys:
                     archive_s3_object_bg(key)
             
             t = threading.Thread(target=archive_batch, args=(s3_keys,))
             t.start()

        # Delete User (Cascade deletes Jobs, Ledger, etc)
        await db.delete(target_user)
        await db.commit()
        
        return {"success": True, "detail": f"User {target_user.email} deleted"}
        
    except Exception as e:
        await db.rollback()
        print(f"Delete User Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
