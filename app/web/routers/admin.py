from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, Job, LedgerEntry, ProviderConfig
from app.domain.billing.service import add_ledger_entry, get_user_balance

from app.core.i18n import get_t, get_current_lang

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Admin Dependency
async def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

@router.get("/", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Stats
    total_users_q = await db.execute(select(func.count(User.id)))
    total_users = total_users_q.scalar()
    
    total_jobs_q = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_q.scalar()
    
    active_jobs_q = await db.execute(select(func.count(Job.id)).where(Job.status == "running"))
    active_jobs = active_jobs_q.scalar()
    
    total_credits_q = await db.execute(select(func.sum(LedgerEntry.amount)))
    total_credits = total_credits_q.scalar() or 0
    
    stats = {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_credits": total_credits
    }

    # Fetch Providers
    providers_q = await db.execute(select(ProviderConfig))
    providers = providers_q.scalars().all()

    # Fetch Recent Users (Top 5)
    recent_users_q = await db.execute(select(User).order_by(User.created_at.desc()).limit(5))
    recent_users_list = recent_users_q.scalars().all()
    
    return templates.TemplateResponse(
        request=request,
        name="admin_dashboard.html",
        context={
            "user": user, 
            "stats": stats,
            "providers": providers,
            "recent_users": recent_users_list,
            "t": get_t(request),
            "lang": get_current_lang(request),
            # Layout Props
            "context": "admin",
            "active_page": "admin_dashboard",
            "nav_links": [
                {"label": "Dashboard", "url": "/admin"},
                {"label": "Overview", "url": "#"}
            ]
        }
    )

@router.get("/users", response_class=HTMLResponse)
async def admin_users(
    request: Request,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users_list = result.scalars().all()
    
    # Enrich with balance (N+1 but okay for admin MVP)
    users_data = []
    for u in users_list:
        balance = await get_user_balance(db, u.id)
        users_data.append((u, balance))

    return templates.TemplateResponse(
        request=request,
        name="admin_users.html",
        context={
            "user": user, 
            "users": users_data,
            "t": get_t(request),
            "lang": get_current_lang(request),
            # Layout Props
            "context": "admin",
            "active_page": "admin_users",
            "nav_links": [
                {"label": "Admin", "url": "/admin"},
                {"label": "Users", "url": "/admin/users"}
            ]
        }
    )

@router.post("/users/credits")
async def add_user_credits(
    user_id: str = Form(...),
    amount: int = Form(...),
    current_admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # UUID conversion handled by Pydantic usually, but Form is string
    import uuid
    uid = uuid.UUID(user_id)
    
    await add_ledger_entry(
        db,
        uid,
        amount,
        reason="admin_grant",
        external_id=f"admin_grant_by_{current_admin.id}"
    )
    
    return RedirectResponse(url="/admin/users", status_code=status.HTTP_302_FOUND)

@router.post("/jobs/{job_id}/curate")
async def toggle_job_curated(
    job_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        return JSONResponse({"error": "Job not found"}, 404)
        
    job.is_curated = not job.is_curated
    await db.commit()
    
    return JSONResponse({"is_curated": job.is_curated})
