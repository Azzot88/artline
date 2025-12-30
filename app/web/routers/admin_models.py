from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, AIModel
from app.domain.providers.replicate_service import get_replicate_client
import uuid

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
        name="admin_models.html",
        context={
            "user": user, 
            "models": models,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/add")
async def add_model(
    model_ref: str = Form(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Fetch schema
        client = await get_replicate_client(db)
        info = await client.fetch_model_schema(model_ref)
        
        # Parse basic info
        # model_ref = "owner/name"
        name_parts = model_ref.split("/")
        display_name = name_parts[1] if len(name_parts) > 1 else model_ref
        
        # Create DB record
        new_model = AIModel(
            model_ref=model_ref,
            provider="replicate",
            display_name=display_name.title().replace("-", " "),
            version_id=info["version_id"],
            param_schema=info["schema"],
            ui_config={}, # Empty initially
            is_active=False # Config first, then activate
        )
        db.add(new_model)
        await db.commit()
        await db.refresh(new_model)
        
        return RedirectResponse(f"/admin/models/{new_model.id}", status_code=302)
        
    except Exception as e:
        # Fetch models again to render the page
        result = await db.execute(select(AIModel).order_by(AIModel.created_at.desc()))
        models = result.scalars().all()
        
        error_msg = str(e)
        if "Replicate provider not configured" in error_msg:
             error_msg = "Please configure the Replicate API Key in the <a href='/admin/providers'>Providers</a> section first."

        return templates.TemplateResponse(
            request=request,
            name="admin_models.html",
            context={
                "user": user, 
                "models": models, 
                "error": error_msg,
                "t": get_t(request),
                "lang": get_current_lang(request)
            }
        )

@router.get("/{model_id}", response_class=HTMLResponse)
async def edit_model(
    request: Request,
    model_id: str,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch model
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Model not found")

    # Prepare schema inputs for templates
    # Replicate OpenAPI schema usually has ["components"]["schemas"]["Input"]["properties"]
    schema_inputs = {}
    if model.param_schema:
        try:
            # Try standard Replicate structure
            components = model.param_schema.get("components", {})
            schemas = components.get("schemas", {})
            input_schema = schemas.get("Input", {})
            schema_inputs = input_schema.get("properties", {})
        except:
             pass # Fallback empty if unknown structure

    return templates.TemplateResponse(
        request=request,
        name="admin_model_edit.html",
        context={
            "user": user, 
            "model": model,
            "schema_inputs": schema_inputs,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/{model_id}/save")
async def save_model_config(
    model_id: str,
    request: Request,
    display_name: str = Form(...),
    cover_image_url: str = Form(None),
    is_active: bool = Form(False), # Checkbox not sent if unchecked implies default false in Form? actually FastAPI handles bool conversion from "on"/missing nicely usually? No, careful.
    # Handling dynamic form fields is tricky with Pydantic. We use Request.form()
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    form_data = await request.form()
    
    # Reload model
    result = await db.execute(select(AIModel).where(AIModel.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404)
        
    # Update Basic
    model.display_name = display_name
    model.cover_image_url = cover_image_url
    model.is_active = is_active # "on" if checked, else need to handle missing
    # Correction: form checkboxes: if not checked, key is missing.
    # So we should check membership
    model.is_active = "is_active" in form_data
    
    # Build UI Config
    # We look for keys starting with "show_", "label_", "default_"
    # We iterate the known schema properties or the form keys?
    # Better to iterate form keys to find overrides.
    
    ui_config = {}
    
    # Extract keys from schema to know what exists? 
    # Or just parse form.
    # Let's parse form data efficiently.
    for key in form_data:
        if key.startswith("label_"):
            field_name = key[6:]
            if field_name not in ui_config: ui_config[field_name] = {}
            ui_config[field_name]["label"] = form_data[key]
        elif key.startswith("default_"):
            field_name = key[8:]
            if field_name not in ui_config: ui_config[field_name] = {}
            ui_config[field_name]["default"] = form_data[key]
        elif key.startswith("show_"):
            field_name = key[5:]
            if field_name not in ui_config: ui_config[field_name] = {}
            ui_config[field_name]["visible"] = True
    
    # Important: Unchecked "show_" means we want it hidden?
    # Our logic in DB: we store what we want. 
    # In the UI loop, we defaulted to "visible=True" in 'checkbox checked'.
    # If key is missing in form, it means user unchecked it (Hidden).
    # BUT we only captured keys present.
    # So we need to mark explicit "visible=False" for items NOT in ui_config?
    # OR simpler: The UI template uses `conf.get('visible', True)`.
    # So if it's missing in `ui_config`, it defaults to True.
    # To hide it, we must store "visible": False.
    # So we need to know ALL possible fields from `model.param_schema` and check if they were in form.
    
    if model.param_schema:
        try:
            props = model.param_schema["components"]["schemas"]["Input"]["properties"]
            for prop_name in props:
                if f"show_{prop_name}" not in form_data:
                    # User unchecked it
                    if prop_name not in ui_config: ui_config[prop_name] = {}
                    ui_config[prop_name]["visible"] = False
                else:
                    # User checked it
                    if prop_name not in ui_config: ui_config[prop_name] = {}
                    ui_config[prop_name]["visible"] = True
        except:
            pass

    model.ui_config = ui_config
    await db.commit()
    
    return RedirectResponse(f"/admin/models/{model_id}", status_code=302)

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
