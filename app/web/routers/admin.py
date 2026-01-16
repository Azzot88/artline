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
    AIModelRead, AIModelCreate, AIModelUpdate
)
from app.domain.billing.service import get_user_balance, add_ledger_entry
from app.domain.providers.service import encrypt_key
from datetime import datetime

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
    
    return AdminStats(
        total_users=total_users,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_credits=total_credits or 0
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
        name=req.name,
        display_name=req.display_name,
        provider=req.provider,
        model_ref=req.model_ref,
        version_id=req.version_id,
        type=req.type,
        credits=req.credits,
        is_active=req.is_active,
        is_pro=req.is_pro,
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
