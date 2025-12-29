from fastapi import APIRouter, Header, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.config import settings
from app.domain.billing.service import add_ledger_entry
from app.models import User
from sqlalchemy import select
import stripe

router = APIRouter()

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: AsyncSession = Depends(get_db)):
    # If no stripe keys, just return ok (development mode / SMPK placeholder)
    if not settings.STRIPE_WEBHOOK_SECRET or "placeholder" in settings.STRIPE_WEBHOOK_SECRET:
        return {"status": "ignored_no_secret"}

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Handle fulfillment
        email = session.get("customer_email") or session.get("customer_details", {}).get("email")
        if email:
            # Find user
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user:
                credits = int(session.get("metadata", {}).get("credits", 0))
                if credits > 0:
                    await add_ledger_entry(
                        db,
                        user.id,
                        credits,
                        reason="topup",
                        external_id=session.get("id")
                    )

    return {"status": "success"}
