from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.deps import get_current_user, get_current_user_optional, get_current_user_or_redirect
from app.models import User, Job, AIModel
from app.domain.jobs.service import create_job, get_user_jobs
from app.domain.billing.service import get_user_balance
from app.domain.jobs.runner import process_job
from app.core.i18n import get_t, get_current_lang
import json

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request, 
    user: User | object | None = Depends(get_current_user_optional), # User or GuestProfile
    db: AsyncSession = Depends(get_db),
    checkout: str | None = None
):
    # Handle Guest State
    if user:
        if isinstance(user, User):
            balance = await get_user_balance(db, user.id)
        else:
            # GuestProfile
            balance = user.balance
        
        # get_user_jobs now accepts object
        jobs = await get_user_jobs(db, user)
    else:
        balance = 0
        jobs = []

    # Fetch Active AI Models
    models_result = await db.execute(select(AIModel).where(AIModel.is_active == True))
    ai_models = models_result.scalars().all()
    
    # Serialize for Frontend Logic
    models_data = []
    for m in ai_models:
        models_data.append({
            "id": str(m.id),
            "name": m.display_name,
            "provider": m.provider,
            "ref": m.model_ref if m.model_ref else "",
            "modes": m.modes or [],
            "resolutions": m.resolutions or [],
            "durations": m.durations or [],
            "costs": m.costs or {},
            "cover": m.cover_image_url,
            "ui_config": m.ui_config or {}
        })
    
    msg = None
    if checkout == "success":
        msg = "Credits added successfully!"
    elif checkout == "cancel":
        msg = "Payment cancelled."
        
    return templates.TemplateResponse(
        request=request, 
        name="dashboard.html", 
        context={
            "user": user, 
            "balance": balance, 
            "jobs": jobs,
            "message": msg,
            "ai_models": ai_models, 
            "models_json": json.dumps(models_data),
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/jobs/new")
async def new_job(
    request: Request,
    user: User | object | None = Depends(get_current_user_optional), # Allow Guests
    db: AsyncSession = Depends(get_db)
):
    # If strictly no user/guest (cookie missing), redirect
    if not user:
        from fastapi import HTTPException
        # Or better, trigger HX-Redirect if HTMX
        if request.headers.get("HX-Request"):
             return templates.TemplateResponse(
                request=request,
                name="partials/flash.html",
                context={"message": "Please sign in or enable cookies.", "level": "warning"}
             )
             # OR redirect?
             # Let's start with redirect if no session at all.
             # Actually create_job handles logic, but we need a user object.
             # Redirect to login
             from fastapi.responses import Response
             response = Response(status_code=200)
             response.headers["HX-Redirect"] = "/login"
             return response

    form_data = await request.form()
    print(f"DEBUG DASHBOARD RECEIVED: {dict(form_data)}") # DEBUG LOG
    
    kind = form_data.get("kind", "image")
    prompt = form_data.get("prompt", "")
    model_id = form_data.get("model", "")
    
    reserved = {"kind", "prompt", "model"}
    params = {}
    for key, value in form_data.items():
        if key not in reserved and value:
             params[key] = value

    job, error = await create_job(db, user, kind, prompt, model_id, params)
    
    if error:
        level = "danger"
        if "Insufficient credits" in error:
            level = "warning"
            # If guest, maybe link to register?
            # For now, flash message.
            if not isinstance(user, User):
                 error = "Please register to continue generating."
        
        return templates.TemplateResponse(
            request=request,
            name="partials/flash.html",
            context={"message": error, "level": level}
        )

    # Queue task
    process_job.delay(job.id)
    
    response = templates.TemplateResponse(
        request=request,
        name="partials/flash.html",
        context={"message": "Job started!", "level": "success"}
    )
    response.headers["HX-Trigger"] = "jobsChanged, balanceChanged"
    return response

@router.get("/jobs/partial", response_class=HTMLResponse)
async def jobs_partial(
    request: Request,
    view: str = "list",
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user: return HTMLResponse("")
    jobs = await get_user_jobs(db, user)
    
    template = "partials/job_list.html"
    if view == "sidebar":
        template = "partials/sidebar_recent.html"
        
    return templates.TemplateResponse(
        request=request, 
        name=template,
        context={
            "jobs": jobs,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.get("/balance/partial", response_class=HTMLResponse)
async def balance_partial(
    request: Request,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user: return HTMLResponse("")
    if isinstance(user, User):
        balance = await get_user_balance(db, user.id)
    else:
        balance = user.balance
        
    return templates.TemplateResponse(
        request=request, 
        name="partials/balance_badge.html",
        context={"balance": balance}
    )

@router.delete("/jobs/{job_id}")
async def delete_job(
    request: Request,
    job_id: str,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user: return status.HTTP_401_UNAUTHORIZED
    
    stmt = select(Job).where(Job.id == job_id)
    if isinstance(user, User):
        stmt = stmt.where(Job.user_id == user.id)
    else:
         stmt = stmt.where(Job.guest_id == user.id)
         
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if job:
        await db.delete(job)
        await db.commit()
    
    return status.HTTP_200_OK

PAGE_SIZE = 20

async def get_gallery_jobs(db: AsyncSession, page: int = 1):
    offset = (page - 1) * PAGE_SIZE
    query = (
        select(Job)
        .where(Job.status == 'succeeded')
        .where(Job.result_url.isnot(None))
        .order_by(Job.created_at.desc())
        .limit(PAGE_SIZE)
        .offset(offset)
    )
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    next_page = page + 1 if len(jobs) == PAGE_SIZE else None
    return jobs, next_page

@router.get("/gallery/page/{page}", response_class=HTMLResponse)
async def gallery_fragment(
    page: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    jobs, next_page = await get_gallery_jobs(db, page=page)
    
    return templates.TemplateResponse(
        request=request, 
        name="partials/gallery_items.html",
        context={
            "jobs": jobs,
            "next_page": next_page
        }
    )
