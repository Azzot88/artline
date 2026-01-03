from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db
from app.models import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

from app.core.i18n import get_t, get_current_lang

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        request=request, 
        name="auth_login.html",
        context={"t": get_t(request), "lang": get_current_lang(request)}
    )

@router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        return templates.TemplateResponse(
            request=request, 
            name="auth_login.html", 
            context={
                "error": "Invalid credentials",
                "t": get_t(request),
                "lang": get_current_lang(request)
            }
        )

    # Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=18000, # 5 hours for example, relies on exp in token mostly
        expires=18000,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )
    return response

@router.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return templates.TemplateResponse(
        request=request, 
        name="auth_signup.html",
        context={"t": get_t(request), "lang": get_current_lang(request)}
    )

@router.post("/signup")
async def signup(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    # Check existing
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        return templates.TemplateResponse(
            request=request, 
            name="auth_signup.html", 
            context={
                "error": "Email already registered",
                "t": get_t(request),
                "lang": get_current_lang(request)
            }
        )
    
    # Create user
    hashed_pw = get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_pw)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Guest Migration
    guest_id_cookie = request.cookies.get("guest_id")
    if guest_id_cookie:
        from app.models import Job
        from sqlalchemy import update
        import uuid
        try:
            gid = uuid.UUID(guest_id_cookie)
            # Update jobs: set user_id, owner_type='user', clear guest_id, clear expires_at
            stmt = (
                update(Job)
                .where(Job.guest_id == gid)
                .values(
                    user_id=new_user.id,
                    owner_type="user",
                    guest_id=None,
                    expires_at=None
                )
            )
            await db.execute(stmt)
            await db.commit()
        except ValueError:
            pass

    # Auto-login
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False 
    )
    return response

@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    response.delete_cookie("access_token")
    return response
