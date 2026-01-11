from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
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
import uuid

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

    models_result = await db.execute(select(AIModel).where(AIModel.is_active == True))
    ai_models = models_result.scalars().all()

    # Fetch Curated Jobs for Community Gallery
    from app.domain.jobs.service import get_curated_jobs
    curated_jobs = await get_curated_jobs(db, limit=6)
    
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
            "balance": balance, 
            "jobs": jobs,
            "curated_jobs": curated_jobs,
            "message": msg,
            "ai_models": ai_models, 
            "models_json": json.dumps(models_data),
            "t": get_t(request),
            "lang": get_current_lang(request),
            # Layout Props
            "context": "home",
            "active_page": "home",
            "nav_links": [
                {"label": "Мастерская", "url": "/"},
                {"label": "Галерея", "url": "#gallery"},
                {"label": "Цены", "url": "/premium"}
            ]
        }
    )

@router.get("/account", response_class=HTMLResponse)
async def account_page(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    balance = await get_user_balance(db, user.id)
    return templates.TemplateResponse(
        request=request,
        name="account.html", # To be created
        context={
            "user": user,
            "balance": balance,
            "t": get_t(request),
            "lang": get_current_lang(request),
            "context": "account",
            "active_page": "account",
            "nav_links": [
                {"label": "Профиль", "url": "/account"},
                {"label": "Настройки", "url": "/account/settings"},
                {"label": "Выход", "url": "/logout"}
            ]
        }
    )

@router.get("/billing", response_class=HTMLResponse)
async def billing_page(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    balance = await get_user_balance(db, user.id)
    return templates.TemplateResponse(
        request=request,
        name="billing.html", # To be created
        context={
            "user": user,
            "balance": balance,
            "t": get_t(request),
            "lang": get_current_lang(request),
            "context": "billing",
            "active_page": "billing",
            "nav_links": [
                {"label": "Тарифы", "url": "/billing"},
                {"label": "История", "url": "/billing/history"}
            ]
        }
    )

@router.get("/models/for-ui")
async def models_for_ui(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns active models with capabilities for UI rendering.
    """
    models_result = await db.execute(select(AIModel).where(AIModel.is_active == True))
    ai_models = models_result.scalars().all()
    
    data = []
    for m in ai_models:
        # Prefer normalized caps for structure
        caps = m.normalized_caps_json or {}
        inputs = caps.get("inputs", [])
        
        # Merge defaults from UI Config if present
        defaults = caps.get("defaults", {}).copy()
        if m.ui_config: 
             for k, v in m.ui_config.items():
                  if isinstance(v, dict) and "default" in v:
                       defaults[k] = v["default"]
        
        data.append({
            "id": str(m.id),
            "name": m.display_name,
            "provider": m.provider,
            "cover_image": m.cover_image_url,
            "inputs": inputs, # The schema for UI builder
            "defaults": defaults,
            "modes": m.modes or ["image"] # fallback
        })
    return data

from pydantic import BaseModel
from typing import Dict, Any

class JobRequest(BaseModel):
    model_id: str
    prompt: str
    params: Dict[str, Any] = {}
    kind: str = "image" # image/video

@router.post("/jobs/new")
async def new_job(
    req: JobRequest,
    request: Request,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
         from fastapi import HTTPException
         raise HTTPException(status_code=401, detail="Please sign in")

    # 1. Fetch Model
    try:
        model_uuid = uuid.UUID(req.model_id)
    except ValueError:
        return JSONResponse({"error": "Invalid model ID format"}, status_code=400)

    res = await db.execute(select(AIModel).where(AIModel.id == model_uuid))
    model = res.scalar_one_or_none()
        
    if not model:
        return JSONResponse({"error": "Model not found"}, status_code=404)

    # 2. Validation (Strict)
    # We use ReplicateService logic helper without instantiating client if possible?
    # Actually build_payload is an instance method but logic is pure.
    # Instantiate service just for logic? Or copy logic? 
    # Better: Instantiate service (cheap). We need to decrypt key anyway?
    # Actually validation doesn't need key. But existing code is in Service.
    # Let's import ReplicateService.
    from app.domain.providers.replicate_service import ReplicateService
    
    # We pass empty key for validation-only usage if we don't want to fetch config yet.
    service = ReplicateService(api_key="validation-only")
    
    # 2.1 Prepare Inputs
    raw_inputs = req.params.copy()
    raw_inputs["prompt"] = req.prompt # Prompt is part of payload
    
    # 2.2 Validate
    allowed_inputs = []
    if model.normalized_caps_json:
         allowed_inputs = model.normalized_caps_json.get("inputs", [])
    
    if allowed_inputs:
         # build_payload filters and validates types
         # But we want to ERROR on invalid types? 
         # build_payload drops them and logs.
         # The requirement says "invalid types/enum give clear validation error".
         # build_payload as written returns a clean payload. It doesn't raise errors.
         # I should arguably update build_payload to support strict mode or 
         # just check if dropped keys exist?
         pass # For now use what we have, possibly logic in build_payload was permissive.
         # Re-checking user prompt: "Неверные типы/enum дают понятную ошибку validation error".
         # I need to implement explicit validation here or improve build_payload.
         # Let's iterate inputs and validate manually here? Or extend build_payload?
         # Extending build_payload is better but it's in another file.
         # I will do a quick check here.
         
         for field in allowed_inputs:
              name = field["name"]
              val = raw_inputs.get(name)
              if val is not None:
                   ftype = field.get("type")
                   # Enum Check
                   if ftype == "select" and "options" in field:
                        if val not in field["options"]:
                             return JSONResponse({"error": f"Invalid value '{val}' for {name}. Allowed: {field['options']}"}, 400)
                   # Type Check (Basic)
                   if ftype == "integer" and not str(val).isdigit():
                        return JSONResponse({"error": f"Invalid integer for {name}: {val}"}, 400)
                   if (ftype == "float" or ftype == "number"):
                        try: float(val)
                        except ValueError:
                             return JSONResponse({"error": f"Invalid number for {name}: {val}"}, 400)
    
    # 3. Create Job
    # We pass everything to create_job. Logic inside runner handles final payload construction too (double safety).
    # But job.prompt should probably be just the prompt text?
    # create_job signature: (db, user, kind, prompt, model_id, params)
    
    job, error = await create_job(db, user, req.kind, req.prompt, req.model_id, req.params)
    
    if error:
         return JSONResponse({"error": error}, status_code=400)
         
    # 4. Trigger Worker
    process_job.delay(job.id)
    
    return {"job_id": job.id, "status": "queued"}

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

@router.post("/jobs/{job_id}/sync")
async def sync_job_status(
    job_id: str,
    request: Request,
    user: User | object | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        return status.HTTP_401_UNAUTHORIZED
        
    stmt = select(Job).where(Job.id == job_id)
    if isinstance(user, User):
        stmt = stmt.where(Job.user_id == user.id)
    else:
        stmt = stmt.where(Job.guest_id == user.id)
        
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        return JSONResponse({"error": "Job not found"}, 404)
        
    if not job.provider_job_id or job.provider != "replicate":
        return JSONResponse({"status": job.status, "synced": False})
        
    # Sync Logic
    from app.models import ProviderConfig
    from app.core.security import decrypt_key
    from app.domain.providers.replicate_service import ReplicateService
    
    # Needs API Key
    provider_cfg = await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate'))
    cfg = provider_cfg.scalars().first()
    if not cfg:
        return JSONResponse({"error": "Provider not configured"}, 500)
        
    api_key = decrypt_key(cfg.encrypted_api_key)
    service = ReplicateService(api_key)
    
    try:
        data = service.get_prediction(job.provider_job_id)
        # Update Job
        new_status = data["status"]
        job.status = new_status
        
        output = data.get("output")
        if new_status == "succeeded":
             if isinstance(output, list) and output:
                  job.result_url = output[0]
             elif isinstance(output, str):
                  job.result_url = output
                  
        elif new_status == "failed":
             job.error_message = str(data.get("error"))
             
        await db.commit()
        
        return JSONResponse({"status": new_status, "synced": True, "result_url": job.result_url})
        
    except Exception as e:
        if request.headers.get("HX-Request"):
             return templates.TemplateResponse("partials/result_card.html", {"request": request, "job": job})
        return JSONResponse({"error": str(e)}, 500)

    # Success Response
    if request.headers.get("HX-Request"):
        # If status is still running, we might want to keep the polling div?
        # The result_card.html partial handles the state (running vs succeeded).
        # So we just return the updated card.
        return templates.TemplateResponse("partials/result_card.html", {"request": request, "job": job})
    
    return JSONResponse({"status": new_status, "synced": True, "result_url": job.result_url})

@router.get("/gallery/page/{page}", response_class=HTMLResponse)
async def gallery_fragment(
    page: int,
    request: Request,
    type: str = "all", # "all" | "curated"
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * PAGE_SIZE
    query = (
        select(Job)
        .where(Job.status == 'succeeded')
        .where(Job.result_url.isnot(None))
    )
    
    if type == "curated":
        query = query.where(Job.is_curated == True)
    else:
        # For public gallery, maybe we only show public items + curated items? 
        # Or just public items? Assuming "community gallery" shows public items.
        # User said: "Users could mark their works public and admin see it in own gallery... 
        # then mark the best which will appear it curated gallery".
        # So "gallery" endpoint likely lists PUBLIC items.
        query = query.where(Job.is_public == True)

    # Sort
    if type == "curated":
         query = query.order_by(Job.likes.desc())
    else:
         query = query.order_by(Job.created_at.desc())
         
    query = query.limit(PAGE_SIZE).offset(offset)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    next_page = page + 1 if len(jobs) == PAGE_SIZE else None
    
    return templates.TemplateResponse(
        request=request, 
        name="partials/gallery_items.html",
        context={
            "jobs": jobs,
            "next_page": next_page
        }
    )

@router.post("/jobs/{job_id}/public")
async def toggle_job_public(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).where(Job.id == job_id, Job.user_id == user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        return JSONResponse({"error": "Job not found"}, 404)
        
    job.is_public = not job.is_public
    await db.commit()
    
    return JSONResponse({"is_public": job.is_public})

@router.post("/jobs/{job_id}/like")
async def toggle_job_like(
    job_id: str,
    db: AsyncSession = Depends(get_db)
    # Likes are anonymous or tracked? User didn't specify. 
    # For now, simplistic implementation: just increment. 
    # ideally we should track who liked what to prevent double-voting.
    # But for MVP based on description "highest likes", I'll just increment.
):
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        return JSONResponse({"error": "Job not found"}, 404)
        
    job.likes += 1
    await db.commit()
    
    return JSONResponse({"likes": job.likes})
