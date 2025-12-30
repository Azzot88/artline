from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.deps import get_current_user
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
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    checkout: str | None = None
):
    balance = await get_user_balance(db, user.id)
    jobs = await get_user_jobs(db, user.id)
    
    # Fetch Active AI Models
    models_result = await db.execute(select(AIModel).where(AIModel.is_active == True))
    ai_models = models_result.scalars().all()
    
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
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/jobs/new")
async def new_job(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    form_data = await request.form()
    
    # Extract known fields
    kind = form_data.get("kind", "image")
    prompt = form_data.get("prompt", "")
    model_id = form_data.get("model", "")
    
    # Extract dynamic parameters
    # We filter out known keys
    reserved = {"kind", "prompt", "model"}
    params = {}
    for key, value in form_data.items():
        if key not in reserved and value:
             params[key] = value

    if not prompt.strip():
         # Error handling for empty prompt
         pass

    # Create Job
    # We treat model_id as the 'model' arg.
    # We pass 'params' potentially? 
    # Since create_job signature is fixed, we might need to serialize params into prompt here 
    # OR update create_job. Let's start with serializing into prompt to avoid changing service signature too much
    # format: <json_params> prompt
    # Actually service.py handles '[model] prompt'. 
    # Let's keep logic in service.py? 
    # Better: Update create_job to accept params dict.
    
    job, error = await create_job(db, user, kind, prompt, model_id, params)
    
    if error:
        return templates.TemplateResponse(
            request=request,
            name="partials/flash.html",
            context={"message": error, "level": "danger"}
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
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user.id))
    job = result.scalar_one_or_none()
    
    if job:
        await db.delete(job)
        await db.commit()
    
    return status.HTTP_200_OK
