from typing import Annotated
from fastapi import Depends, HTTPException, status, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import User
from app.core.security import decode_access_token
from app.domain.users.guest_models import GuestProfile

async def get_current_user_optional(
    request: Request, 
    db: AsyncSession = Depends(get_db),
    # Guest Cookie handled via Request
) -> User | GuestProfile | None: 
    # 1. Check Bearer Token (Auth Header or Cookie)
    token = request.cookies.get("access_token")
    if token:
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        
        payload = decode_access_token(token)
        if payload:
            email: str = payload.get("sub")
            if email:
                result = await db.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
                if user: return user

    # 2. Check Guest
    guest_id_cookie = request.cookies.get("guest_id")
    if guest_id_cookie:
        from app.domain.users.guest_service import get_or_create_guest
        try:
            import uuid
            gid = uuid.UUID(guest_id_cookie)
            # Ensure DB record exists if cookie is valid UUID
            guest = await get_or_create_guest(db, gid)
            if guest:
                return guest
        except ValueError:
            pass
            
    return None

async def get_current_user(user: User | None = Depends(get_current_user_optional)) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_or_redirect(
    request: Request,
    user: User | None = Depends(get_current_user_optional)
) -> User:
    if not user:
        # Check if HTMX request
        if request.headers.get("HX-Request"):
            # Return 200 with HX-Redirect header
            from fastapi.responses import Response
            response = Response(status_code=200)
            response.headers["HX-Redirect"] = "/login"
            # We cannot return Response from a dependency easily to stop execution, 
            # Dependency must return User or Raise.
            # Raising HTTPException works, but pure RedirectResponse is better for Page routes.
            # But Dependencies can't return Responses directly to client unless they raise.
            # Actually, standard way is raising HTTPException with 401, blocking execution.
            # But the user asked for REDIRECT.
            # For page routes, we want 307 Redirect.
            # For HTMX, we want HX-Redirect.
            
            # Since dependencies are executed before route, we can raise a special exception 
            # OR we can simply RedirectResponse (which is an Exception kind of?). No.
            # We can use Starlette's RedirectResponse but that doesn't bubble up from Dependency unless we raise it?
            # Actually, raising HTTPException(status_code=307, headers={"Location": "/login"}) works in standard browsers.
            pass
        
        # Determine strict or redirection based on Accept header? 
        # Or just assume this dependency is for Pages.
        # Browser Redirect
        from fastapi.responses import RedirectResponse
        # Raising an exception that FastAPI handles?
        # A 302/307 Redirect
        # NOTE: FastAPI dependencies cannot easily return a Response object to abort the request 
        # except by raising an HTTPException.
        # But we can raise verify_exceptions.HTTPException with status 302/307.
        
        # Wait, simple approach:
        # We can raise a custom exception and handle it in main.py? 
        # Or simply:
        raise HTTPException(
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
            headers={"Location": "/login"},
            detail="Login required"
        )
        
    return user
