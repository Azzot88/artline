"""
Email verification service - business logic for code generation, validation, and rate limiting.
"""

import random
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.core.config import settings
from app.domain.users.email_service import send_verification_email
from app.schemas import EmailVerificationStatus


async def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))


async def send_verification_code(
    db: AsyncSession,
    user: User
) -> Tuple[bool, Optional[str]]:
    """
    Generate and send verification code to user's email.
    Enforces rate limiting (60 seconds cooldown).
    
    Args:
        db: Database session
        user: User object
        
    Returns:
        (success: bool, error_message: Optional[str])
    """
    # Check if already verified
    if user.is_email_verified:
        return False, "Email already verified"
    
    # Rate limit check (60 seconds)
    if user.email_verification_sent_at:
        time_since_last = datetime.now(user.email_verification_sent_at.tzinfo) - user.email_verification_sent_at
        cooldown = timedelta(seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS)
        
        if time_since_last < cooldown:
            seconds_left = int((cooldown - time_since_last).total_seconds())
            return False, f"Please wait {seconds_left} seconds before requesting a new code"
    
    # Generate new code
    code = await generate_verification_code()
    expires_at = datetime.now(user.created_at.tzinfo) + timedelta(
        minutes=settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES
    )
    
    # Update user with new code
    user.email_verification_code = code
    user.email_verification_code_expires_at = expires_at
    user.email_verification_sent_at = datetime.now(user.created_at.tzinfo)
    
    await db.commit()
    
    # Send email
    email_sent = await send_verification_email(
        email=user.email,
        code=code,
        language=user.language
    )
    
    if not email_sent:
        return False, "Failed to send email. Please try again later."
    
    return True, None


async def verify_code(
    db: AsyncSession,
    user: User,
    code: str
) -> Tuple[bool, Optional[str]]:
    """
    Verify the provided code against user's stored code.
    Checks expiration and validity.
    
    Args:
        db: Database session
        user: User object
        code: 6-digit code to verify
        
    Returns:
        (success: bool, error_message: Optional[str])
    """
    # Already verified
    if user.is_email_verified:
        return False, "Email already verified"
    
    # No code sent yet
    if not user.email_verification_code:
        return False, "No verification code sent. Please request a new code."
    
    # Code expired
    if user.email_verification_code_expires_at:
        now = datetime.now(user.email_verification_code_expires_at.tzinfo)
        if now > user.email_verification_code_expires_at:
            return False, "Verification code expired. Please request a new code."
    
    # Code mismatch
    if user.email_verification_code != code:
        return False, "Invalid verification code"
    
    # Success - mark as verified
    user.is_email_verified = True
    user.email_verification_code = None  # Clear code
    user.email_verification_code_expires_at = None
    
    await db.commit()
    
    return True, None


async def check_verification_status(user: User) -> EmailVerificationStatus:
    """
    Check email verification status and resend availability.
    
    Args:
        user: User object
        
    Returns:
        EmailVerificationStatus with current status and resend availability
    """
    can_resend = True
    next_resend_at = None
    
    if user.is_email_verified:
        can_resend = False
    elif user.email_verification_sent_at:
        time_since_last = datetime.now(user.email_verification_sent_at.tzinfo) - user.email_verification_sent_at
        cooldown = timedelta(seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS)
        
        if time_since_last < cooldown:
            can_resend = False
            next_resend_at = user.email_verification_sent_at + cooldown
    
    return EmailVerificationStatus(
        is_verified=user.is_email_verified,
        can_resend=can_resend,
        next_resend_at=next_resend_at
    )
