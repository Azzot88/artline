from datetime import timedelta
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
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
from app.domain.jobs.service import create_job, get_user_jobs, get_public_jobs
from app.domain.jobs.runner import process_job
from app.domain.users.guest_service import get_or_create_guest

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
    guest_id_cookie = request.cookies.get("guest_id")
    gid = None
    if guest_id_cookie:
        try:
            gid = uuid.UUID(guest_id_cookie)
        except ValueError:
            pass
            
    guest = await get_or_create_guest(db, gid)
    
    return UserContext(
        user=None,
        is_guest=True,
        balance=guest.balance,
        guest_id=str(guest.id)
    )

@router.get("/jobs", response_model=list[JobRead])
async def list_jobs(
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
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

@router.post("/jobs", response_model=JobRead)
async def create_spa_job(
    req: JobRequestSPA,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        # If API accessed without cookie (e.g. Curl), we technically should error 401?
        # But SPA should have cookie. If cookie missing, Depends returns None.
        # But wait, middleware sets cookie. So request from browser ALWAYS has guest_id.
        # If curl without cookie -> User is None.
        raise HTTPException(status_code=401, detail="Authentication required (Cookie)")

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
        
    print(f"[Generation Flow] API: Job Created {job.id} for User {user.id if hasattr(user, 'id') else 'guest'}. Model: {req.model_id}", flush=True)
    process_job.delay(job.id)
    return job

@router.get("/jobs/{job_id}", response_model=JobRead)
async def get_job_status(
    job_id: str,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
         raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(Job).where(Job.id == job_id)
    # Permission check
    if isinstance(user, User):
        stmt = stmt.where(Job.user_id == user.id)
    else:
        stmt = stmt.where(Job.guest_id == user.id)
        
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Sync Logic Reuse?
    # If job is processing, we might want to trigger sync if not already done recently?
    # For now, rely on worker updating DB. 
    # Or reuse the sync logic if provider calls are cheap? 
    # Current sync logic uses Replicate API. 
    # Let's keep it passively reading DB for high performance polling, 
    # assuming webhook/worker updates DB.
    # If job is stuck in 'processing' for too long, maybe we sync? 
    # Leave for later optimization.
    
    return job

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

@router.post("/jobs/{job_id}/like")
async def like_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.likes += 1
    await db.commit()
    return {"likes": job.likes}

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
             "provider": m.provider,
             "cover_image": m.cover_image_url,
             "inputs": m.normalized_caps_json.get("inputs", []) if m.normalized_caps_json else [],
             "defaults": m.normalized_caps_json.get("defaults", {}) if m.normalized_caps_json else {}
         })
    return data
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
