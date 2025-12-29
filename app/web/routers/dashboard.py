from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, Job
from app.domain.jobs.service import create_job, get_user_jobs
from app.domain.billing.service import get_user_balance
from app.domain.jobs.runner import process_job

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

from app.core.i18n import get_t, get_current_lang

@router.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    checkout: str | None = None
):
    balance = await get_user_balance(db, user.id)
    jobs = await get_user_jobs(db, user.id)
    
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
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/jobs/new")
async def new_job(
    request: Request,
    kind: str = Form(...),
    prompt: str = Form(...),
    model: str = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not prompt.strip():
        # Using HTMX retargeting or just flashing
        # For simplicity, returning a toast or flash message via OOB swap often used
        # But we'll mostly rely on standard form handling or quick redirect
        # Let's do a redirect with flash pattern or re-render 
        pass 

    job, error = await create_job(db, user, kind, prompt, model)
    
    if error:
        # We can return an error partial or use HX-Trigger to show toast
        # For MVP, let's just re-render dashboard with error? 
        # Or better, use hx-target="#flash-container"
        return templates.TemplateResponse(
            request=request,
            name="partials/flash.html",
            context={"message": error, "level": "danger"}
        )

    # Queue task
    process_job.delay(job.id)
    
    # Return success flash + trigger list update
    # We can return multiple partials via OOB
    # or just return the list and a trigger.
    # Pattern: Return updated Job List row(s) or the whole list, 
    # and use HX-Trigger to update balance.
    
    # Simplest: Return empty string/flash and trigger "jobsChanged"
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
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    jobs = await get_user_jobs(db, user.id)
    return templates.TemplateResponse(
        request=request, 
        name="partials/job_list.html",
        context={
            "jobs": jobs,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.get("/balance/partial", response_class=HTMLResponse)
async def balance_partial(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    balance = await get_user_balance(db, user.id)
    return templates.TemplateResponse(
        request=request, 
        name="partials/balance_badge.html",
        context={"balance": balance}
    )

@router.delete("/jobs/{job_id}")
async def delete_job(
    request: Request,
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find job
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user.id))
    job = result.scalar_one_or_none()
    
    if job:
        await db.delete(job)
        await db.commit()
    
    # Return updated list or empty string
    return status.HTTP_200_OK
