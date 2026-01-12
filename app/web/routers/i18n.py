
from fastapi import APIRouter, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from app.core.i18n import SUPPORTED_LANGUAGES

router = APIRouter()

class LanguageSchema(BaseModel):
    code: str

@router.get("/lang/{code}")
async def set_language(code: str, request: Request):
    """
    Set the interface language via cookie and redirect to the page the user came from.
    Legacy endpoint for server-side redirects.
    """
    if code not in SUPPORTED_LANGUAGES:
        code = "ru"
        
    redirect_url = request.headers.get("referer", "/dashboard")
    
    response = RedirectResponse(url=redirect_url)
    # Set cookie for 1 year
    response.set_cookie(
        key="artline_lang", 
        value=code, 
        max_age=31536000, 
        httponly=True, 
        samesite="lax"
    )
    return response

@router.post("/api/lang")
async def set_language_api(payload: LanguageSchema):
    """
    Set language cookie via API without redirect.
    Used by React frontend to sync user preference with backend.
    """
    lang_code = payload.code if payload.code in SUPPORTED_LANGUAGES else "ru"
    
    response = JSONResponse(content={"success": True, "language": lang_code})
    
    response.set_cookie(
        key="artline_lang",
        value=lang_code,
        max_age=31536000, # 1 year
        httponly=True,
        samesite="lax",
        secure=False # Set to True in production with HTTPS
    )
    
    return response
