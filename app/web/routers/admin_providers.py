import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models import User, ProviderConfig
from app.domain.providers.service import (
    PROVIDERS_LIST, 
    get_adapter, 
    encrypt_key, 
    mask_key, 
    decrypt_key
)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

from app.core.i18n import get_t, get_current_lang

async def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/", response_class=HTMLResponse)
async def admin_providers_list(
    request: Request, 
    user: User = Depends(get_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProviderConfig).order_by(ProviderConfig.created_at.desc()))
    configs_db = result.scalars().all()
    
    # Process for display
    configs = []
    for c in configs_db:
        # Safe Decryption
        try:
            decrypted = decrypt_key(c.encrypted_api_key)
            masked = "****" + decrypted[-4:] if len(decrypted) > 4 else "****"
        except Exception:
            masked = "****(Invalid/Legacy Key)"

        configs.append({
            "id": c.id,
            "provider_id": c.provider_id,
            "provider_label": next((p["label"] for p in PROVIDERS_LIST if p["id"] == c.provider_id), c.provider_id),
            "name": c.name or "-",
            "status": c.status,
            "last_tested": c.last_tested_at,
            "masked_key": masked
        })

    return templates.TemplateResponse(
        request=request,
        name="admin_providers.html",
        context={
            "user": user, 
            "configs": configs, 
            "providers_list": PROVIDERS_LIST,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.post("/test")
async def test_provider_key(
    provider_id: str = Form(...),
    api_key: str = Form(...),
    user: User = Depends(get_admin_user)
):
    adapter = get_adapter(provider_id)
    # 1. Format Validation
    if not adapter.validate_format(api_key.strip()):
        return JSONResponse({
            "ok": False, 
            "message": "Key format doesn't match provider requirements"
        })
    
    # 2. Connection Test
    result = await adapter.test_connection(api_key.strip())
    return JSONResponse({
        "ok": result.ok,
        "message": result.message,
        "details": result.details
    })

@router.post("/save")
async def save_provider_config(
    provider_id: str = Form(...),
    api_key: str = Form(...),
    name: str = Form(None),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    api_key = api_key.strip()
    adapter = get_adapter(provider_id)
    
    if not adapter.validate_format(api_key):
        raise HTTPException(400, "Invalid key format")
    
    # Encrypt
    enc_key = encrypt_key(api_key)
    
    new_config = ProviderConfig(
        provider_id=provider_id,
        name=name,
        encrypted_api_key=enc_key,
        status="not_tested",
        is_active=True
    )
    db.add(new_config)
    await db.commit()
    
    return RedirectResponse(url="/admin/providers", status_code=302)

@router.post("/delete")
async def delete_provider_config(
    id: int = Form(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(ProviderConfig).where(ProviderConfig.id == id))
    await db.commit()
    return RedirectResponse(url="/admin/providers", status_code=302)

@router.post("/seed")
async def seed_demo_data(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if empty to avoid dups
    # Just insert demos
    demos = [
        ("openai", "sk-demo_1234567890abcdef", "Demo OpenAI"),
        ("stability", "sk-demo_stability_1234567890", "Demo Stability"),
        ("replicate", "r8_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "Demo Replicate")
    ]
    
    for pid, k, n in demos:
        db.add(ProviderConfig(
            provider_id=pid,
            name=n,
            encrypted_api_key=encrypt_key(k),
            status="invalid", # Because it's a demo key, test would fail
            error_message="Demo key"
        ))
    await db.commit()
    await db.commit()
    return RedirectResponse(url="/admin/providers", status_code=302)

@router.post("/{id}/test")
async def test_saved_provider(
    id: int,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch config
    config = await db.get(ProviderConfig, id)
    if not config:
        return JSONResponse({"ok": False, "message": "Config not found"}, status_code=404)

    try:
        # Decrypt
        api_key = decrypt_key(config.encrypted_api_key)
        
        # Test
        adapter = get_adapter(config.provider_id)
        result = await adapter.test_connection(api_key)
        
        # Update Status
        config.status = "valid" if result.ok else "invalid"
        config.last_tested_at = datetime.datetime.now(datetime.timezone.utc)
        config.error_message = result.message if not result.ok else None
        
        await db.commit()
        
        return JSONResponse({
            "ok": result.ok,
            "message": result.message,
            "new_status": config.status,
            "last_tested": config.last_tested_at.strftime('%Y-%m-%d %H:%M')
        })
        
    except Exception as e:
        return JSONResponse({"ok": False, "message": str(e)}, status_code=500)
