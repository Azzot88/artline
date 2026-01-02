from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user_optional, get_db
from app.domain.jobs.models import Job
from app.core.i18n import get_t, get_current_lang

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

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

@router.get("/", response_class=HTMLResponse)
async def index_page(
    request: Request, 
    user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    jobs, next_page = await get_gallery_jobs(db, page=1)
    
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={
            "user": user,
            "jobs": jobs,
            "next_page": next_page,
            "t": get_t(request),
            "lang": get_current_lang(request)
        }
    )

@router.get("/gallery/page/{page}", response_class=HTMLResponse)
async def gallery_fragment(
    page: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    jobs, next_page = await get_gallery_jobs(db, page=page)
    
    # Return ONLY the partial items
    return templates.TemplateResponse(
        request=request,
        name="partials/gallery_items.html",
        context={
            "jobs": jobs,
            "next_page": next_page
        }
    )
