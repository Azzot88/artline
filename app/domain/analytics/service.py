from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from app.domain.analytics.models import UserActivity
from typing import Optional, Dict, Any, List
from fastapi import Request
from datetime import datetime, timedelta

class AnalyticsService:
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request: Optional[Request] = None,
        guest_id: Optional[str] = None
    ):
        """
        Logs a user action to the database.
        """
        path = None
        ip_address = None
        user_agent = None

        if request:
            path = request.url.path
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
            # Try to get guest_id from cookies if not provided
            if not guest_id:
                guest_id = request.cookies.get("guest_id")

        activity = UserActivity(
            user_id=user_id,
            guest_id=guest_id,
            action=action,
            details=details,
            path=path,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(activity)
        # We assume the caller handles the commit/flush or it happens at the end of the request
        
    @staticmethod
    async def get_recent_activity(
        db: AsyncSession,
        limit: int = 100,
        offset: int = 0
    ) -> List[UserActivity]:
        stmt = select(UserActivity).order_by(desc(UserActivity.created_at)).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_daily_visitors(db: AsyncSession, days: int = 30):
        """
        Returns unique visitors count per day for the last N days.
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # PostgreSQL specific: date_trunc('day', created_at)
        # We use text() for the date_trunc to ensure compatibility or just use func.date_trunc if mapped
        
        stmt = (
            select(
                func.date_trunc('day', UserActivity.created_at).label('day'),
                func.count(func.distinct(UserActivity.guest_id)).label('visitors'),
                func.count(UserActivity.id).label('actions')
            )
            .where(UserActivity.created_at >= start_date)
            .group_by(text('day'))
            .order_by(text('day'))
        )
        
        result = await db.execute(stmt)
        return result.all()
