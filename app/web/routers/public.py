from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.core.deps import get_current_user_optional

from app.core.i18n import get_t, get_current_lang

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def landing_page(request: Request, user=Depends(get_current_user_optional)):
    return templates.TemplateResponse(
        request=request, 
        name="landing.html", 
        context={
            "user": user,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )
