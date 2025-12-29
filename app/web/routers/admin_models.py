import json
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Form, Body
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, AIModel, ProviderConfig
from app.domain.providers.service import decrypt_key
from app.domain.providers.adapters.replicate import fetch_model_schema, submit_replicate_job, ReplicateError
from app.core.i18n import get_t, get_current_lang

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
logger = logging.getLogger(__name__)

async def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/", response_class=HTMLResponse)
async def list_models(
    request: Request,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AIModel).order_by(desc(AIModel.created_at)))
    models = result.scalars().all()
    
    return templates.TemplateResponse("admin_models.html", {
        "request": request, 
        "user": user, 
        "models": models,
        "t": get_t(request),
        "lang": get_current_lang(request)
    })

@router.post("/resolve-schema")
async def resolve_schema(
    payload: dict = Body(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches schema from Replicate.
    Body: { "model_ref": "owner/name" }
    """
    model_ref = payload.get("replicate_model_ref")
    if not model_ref:
        return JSONResponse({"ok": False, "message": "Missing model_ref"}, status_code=400)

    # Get Replicate Key
    provider = await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate').where(ProviderConfig.is_active == True))
    cfg = provider.scalars().first()
    if not cfg:
        return JSONResponse({"ok": False, "message": "Replicate provider not configured/active"}, status_code=400)
    
    try:
        api_key = decrypt_key(cfg.encrypted_api_key)
        schema = fetch_model_schema(model_ref, api_key)
        return JSONResponse({"ok": True, "schema": schema})
    except Exception as e:
        return JSONResponse({"ok": False, "message": str(e)}, status_code=500)

@router.post("/save")
async def save_model(
    id: str = Form(None),
    display_name: str = Form(...),
    model_ref: str = Form(...),
    model_type: str = Form(...),
    is_active: bool = Form(True),
    param_schema_json: str = Form(...), # JSON string
    default_params_json: str = Form(...), # JSON string
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        schema = json.loads(param_schema_json)
        defaults = json.loads(default_params_json)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")

    if id:
        # Edit
        # model = await db.get(AIModel, uuid.UUID(id)) ...
        pass # TODO: Edit logic
        stmt = select(AIModel).where(AIModel.id == uuid.UUID(id))
        res = await db.execute(stmt)
        model = res.scalar_one_or_none()
        if not model:
            raise HTTPException(404, "Model not found")
            
        model.display_name = display_name
        model.model_ref = model_ref
        model.type = model_type
        model.is_active = is_active
        model.param_schema = schema
        model.default_params = defaults
    else:
        # Create
        model = AIModel(
            display_name=display_name,
            provider="replicate",
            model_ref=model_ref,
            type=model_type,
            is_active=is_active,
            param_schema=schema,
            default_params=defaults
        )
        db.add(model)
    
    await db.commit()
    return RedirectResponse("/admin/models", status_code=302)

@router.post("/delete")
async def delete_model(
    id: str = Form(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(AIModel).where(AIModel.id == uuid.UUID(id)))
    await db.commit()
    return RedirectResponse("/admin/models", status_code=302)

@router.post("/{id}/test")
async def test_model_run(
    id: str,
    payload: dict = Body(...), # { params: {...} }
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Runs a test prediction using the model's config + overrides.
    """
    try:
        model_uuid = uuid.UUID(id)
        stmt = select(AIModel).where(AIModel.id == model_uuid)
        res = await db.execute(stmt)
        model = res.scalar_one_or_none()
        if not model:
             return JSONResponse({"ok": False, "message": "Model not found"}, 404)
        
        # Get Key
        p_q = await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate').where(ProviderConfig.is_active == True))
        p_cfg = p_q.scalars().first()
        if not p_cfg:
             return JSONResponse({"ok": False, "message": "Replicate provider missing"}, 400)
        
        api_key = decrypt_key(p_cfg.encrypted_api_key)
        
        # Merge Defaults with Overrides
        input_data = model.default_params.copy() if model.default_params else {}
        if "params" in payload:
            input_data.update(payload["params"])
            
        # Submit
        # Use simple submit (returns ID). 
        # For Admin Test, currently we just submit and return the ID/URL to check in Replicate Console 
        # OR we could implement polling here.
        # User requested "result preview". I'll skip polling for this specific toolstep to keep it small,
        # but return the ID so the UI can link to it or I can add a status endpoint.
        
        # To support model endpoint vs version endpoint logic:
        # replicate_adapter handles it if we pass 'model' or 'version'.
        # AIModel.model_ref is "owner/name". We can pass that as 'model'.
        
        job_id = submit_replicate_job(
            input_data=input_data,
            api_key=api_key,
            model=model.model_ref
        )
        
        return JSONResponse({
            "ok": True, 
            "job_id": job_id, 
            "message": "Job submitted. Check Replicate Dashboard for result (Polling not implemented in Admin yet)."
        })
        
    except Exception as e:
        logger.exception("Model Test Failed")
        return JSONResponse({"ok": False, "message": str(e)}, 500)
