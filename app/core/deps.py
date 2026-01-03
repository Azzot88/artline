from typing import Annotated
from fastapi import Depends, HTTPException, status, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import User
from app.core.security import decode_access_token
from app.domain.users.guest_service import get_guest

async def get_current_user_optional(
    request: Request, 
    db: AsyncSession = Depends(get_db),
    # Guest Cookie
    # Note: Using Request to get cookies is safer for optional logic than adding annotated Cookie which might enforce something
) -> User | dict | None: # Returning 'dict' to represent guest or a dedicated Model
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
        try:
            import uuid
            gid = uuid.UUID(guest_id_cookie)
            guest = await get_guest(db, gid)
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
