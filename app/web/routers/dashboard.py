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
