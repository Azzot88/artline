from fastapi import APIRouter, Response, Request
from fastapi.responses import RedirectResponse
from app.core.i18n import SUPPORTED_LANGUAGES

router = APIRouter()

@router.get("/lang/{code}")
async def set_language(code: str, request: Request):
    """
    Set the interface language via cookie and redirect to the page the user came from.
    """
    if code not in SUPPORTED_LANGUAGES:
        code = "en"
        
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
