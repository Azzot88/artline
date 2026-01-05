from typing import Annotated, List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Body
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, AIModel
from app.domain.providers.replicate_service import get_replicate_client
import uuid
import json
import datetime

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

from app.core.i18n import get_t, get_current_lang

async def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin required")
    return user

@router.get("/", response_class=HTMLResponse)
async def list_models(
    request: Request,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AIModel).order_by(AIModel.created_at.desc()))
    models = result.scalars().all()
    return templates.TemplateResponse(
        request=request,
        name="admin_models_list.html",
        context={
            "user": user, 
            "models": models,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

class ModelCapabilities(BaseModel):
    modes: List[str] = []
    resolutions: List[str] = []
    durations: List[int] = []
    costs: Dict[str, Any] = {}

class ModelUpdateSchema(BaseModel):
    display_name: str
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    model_ref: str
    version_id: Optional[str] = None
    is_active: bool = False
    provider: str = "replicate"
    capabilities: ModelCapabilities
    ui_config: Dict[str, Any] = {}
    
    model_config = ConfigDict(protected_namespaces=())

@router.get("/{model_id}/details")
async def get_model_details(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Model not found")
        
    return {
        "id": str(model.id),
        "display_name": model.display_name,
        "description": "", # Field removed from DB
        "model_ref": model.model_ref,
        "version_id": model.version_id,
        "provider": model.provider,
        "cover_image_url": model.cover_image_url,
        "is_active": model.is_active,
        "ui_config": model.ui_config or {},
        "replicate_owner": model.replicate_owner,
        "replicate_name": model.replicate_name,
        "normalized_caps_json": model.normalized_caps_json,
        "capabilities": {
            "modes": model.modes or [],
            "resolutions": model.resolutions or [],
            "durations": model.durations or [],
            "costs": model.costs or {}
        },
        "param_schema": model.param_schema
    }

@router.post("/{model_id}/sync-capabilities")
async def sync_model_capabilities(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Model
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Model not found")
        
    if not model.model_ref:
         raise HTTPException(400, "Model reference (owner/name) is missing")

    # 2. Fetch Capabilities
    try:
        from app.domain.providers.replicate_service import get_replicate_client
        client = await get_replicate_client(db)
        
        info = client.fetch_model_capabilities(model.model_ref)
        # returns { "raw_response": ..., "normalized_caps": ... }
        
        # 3. Save to DB
        model.raw_schema_json = info["raw_response"]
        model.normalized_caps_json = info["normalized_caps"]
        
        # Extract owner/name from info?
        model.replicate_owner = info["normalized_caps"].get("owner")
        model.replicate_name = info["normalized_caps"].get("title")
        
        # Also map to param_schema if needed (legacy compatibility)
        if "latest_version" in info["raw_response"]:
             model.version_id = info["raw_response"]["latest_version"]["id"]
             model.param_schema = info["raw_response"]["latest_version"].get("openapi_schema")
             
        await db.commit()
        
        return {
            "status": "ok",
            "synced_at": datetime.datetime.now().isoformat(),
            "capabilities": info["normalized_caps"]
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(400, f"Sync Failed: {str(e)}")

@router.delete("/{model_id}")
async def delete_model(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(404, "Model not found")
            
        await db.delete(model)
        await db.commit()
        return {"status": "ok"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(400, f"Delete failed: {str(e)}")

@router.post("/add")
async def add_model(
    request: Request,
    model_ref: str = Form(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Fetch schema/capabilities
        client = await get_replicate_client(db)
        # info = { "raw_response": ..., "normalized_caps": ... }
        info = client.fetch_model_capabilities(model_ref)
        
        raw_resp = info["raw_response"]
        caps = info["normalized_caps"]
        
        # Parse basic info
        display_name = caps.get("title") or model_ref.split("/")[-1]
        
        # Create DB record
        new_model = AIModel(
            model_ref=model_ref,
            provider="replicate",
            display_name=display_name,
            version_id=raw_resp.get("latest_version", {}).get("id"),
            
            # Persisted Capabilities
            replicate_owner=caps.get("owner"),
            replicate_name=caps.get("title"),
            raw_schema_json=raw_resp,
            normalized_caps_json=caps,
            
            # Legacy fields (optional but good for backward compat)
            param_schema=raw_resp.get("latest_version", {}).get("openapi_schema"),
            
            ui_config={}, 
            is_active=False 
        )
        db.add(new_model)
        await db.commit()
        await db.refresh(new_model)
        
        return RedirectResponse(f"/admin/models/?selected={new_model.id}", status_code=302)
        
    except Exception as e:
        await db.rollback()
        # ... (keep error handling but maybe simplify to redirect with error param?)
        # For now, keeping as is but ensuring no standalone page render if possible.
        # Actually returning template with error is fine for /add error state.
        result = await db.execute(select(AIModel).order_by(AIModel.created_at.desc()))
        models = result.scalars().all()
        
        error_msg = str(e)
        if "Replicate provider not configured" in error_msg:
             error_msg = "Please configure the Replicate API Key in the <a href='/admin/providers'>Providers</a> section first."

        return templates.TemplateResponse(
            request=request,
            name="admin_models_list.html",
            context={
                "user": user, 
                "models": models, 
                "error": error_msg,
                "t": get_t(request),
                "lang": get_current_lang(request)
            }
        )

@router.get("/{model_id}", response_class=RedirectResponse)
async def map_legacy_edit_route(model_id: str):
    return RedirectResponse(f"/admin/models/?selected={model_id}")

@router.post("/{model_id}/save")
async def save_model_config(
    model_id: str,
    update_data: ModelUpdateSchema,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Model not found")
        
    # Update Basic Info
    model.display_name = update_data.display_name
    model.description = update_data.description
    model.cover_image_url = update_data.cover_image_url
    model.model_ref = update_data.model_ref
    model.version_id = update_data.version_id
    model.is_active = update_data.is_active
    model.provider = update_data.provider
    
    # Update Capabilities
    caps = update_data.capabilities
    model.modes = caps.modes
    model.resolutions = caps.resolutions
    model.durations = caps.durations
    model.costs = caps.costs
    
    # Update UI Config
    model.ui_config = update_data.ui_config
    
    await db.commit()
    return {"status": "ok", "model_id": str(model.id)}

@router.post("/{model_id}/preview")
async def model_preview(
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Load active config
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model: return JSONResponse({"error": "Not found"}, 404)
    
    # 2. Construct Input
    # We use the defaults from ui_config.
    # In a real test form, we'd accept POST body with overrides. 
    # For this "Quick Preview" MVP, let's just use the defaults the admin defined.
    
    inputs = {}
    if model.ui_config:
        for key, conf in model.ui_config.items():
            if conf.get("visible", False) and conf.get("default"):
                # Warning: Type conversion? Replicate expects int/float, we stored string.
                # Ideally we check type in schema.
                val = conf["default"]
                # Try simple int conversion
                if str(val).isdigit(): val = int(val)
                inputs[key] = val
                
    # Always ensure prompt if missing?
    if "prompt" not in inputs:
        inputs["prompt"] = "A futuristic city, cinematic lighting, 8k" # Fallback
        
    try:
        client = await get_replicate_client(db)
        # Note: version_id is required. 
        # If we only have owner/name, client.run needs version. 
        # We stored version_id in DB.
        
        full_ref = f"{model.model_ref}:{model.version_id}"
        
        url = await client.generate_preview(full_ref, inputs)
        return JSONResponse({"ok": True, "url": url})
    except Exception as e:
         return JSONResponse({"ok": False, "error": str(e)})
