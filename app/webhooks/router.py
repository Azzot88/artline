from fastapi import APIRouter, Request, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import Job, User
from app.domain.billing.service import add_ledger_entry
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/replicate")
async def replicate_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle incoming webhooks from Replicate.
    Idempotent: Checks if job is already in terminal state.
    Recoverable: Refunds credits on failure.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Basic validation
    provider_job_id = payload.get("id")
    if not provider_job_id:
        return {"status": "ignored", "reason": "no_id"}

    status_ = payload.get("status")
    output = payload.get("output")
    error = payload.get("error")

    logger.info(f"Webhook received for {provider_job_id}: {status_}")
    print(f"[Generation Flow] Webhook: Received {provider_job_id} | Status: {status_}", flush=True)

    # Find Job
    # We search by provider_job_id
    q = await db.execute(select(Job).where(Job.provider_job_id == provider_job_id))
    job = q.scalar_one_or_none()
    
    if job:
         print(f"[Generation Flow] Webhook: Matched to Job {job.id}", flush=True)

    if not job:
        # Might be a job from another environment or deleted
        logger.warning(f"Job not found for provider_id {provider_job_id}")
        return {"status": "ignored", "reason": "job_not_found"}

    # Idempotency Check
    if job.status in ["succeeded", "failed"]:
        logger.info(f"Job {job.id} already {job.status}. Ignoring webhook.")
        return {"status": "ignored", "reason": "already_terminal"}

    # Handle completion
    if status_ == "succeeded":
        job.status = "succeeded"
        job.progress = 100
        
        # Replicate output varies. Usually list of URLs for images.
        # For video, might be string or list.
        # We take the first item if list.
        if isinstance(output, list) and len(output) > 0:
            job.result_url = output[0]
        elif isinstance(output, str):
            job.result_url = output
        
        await db.commit()
    
    # Handle failure/cancellation (Refund)
    elif status_ in ["failed", "canceled"]:
        job.status = "failed"
        job.error_message = str(error) if error else "Unknown error from provider"
        
        # REFUND
        if job.cost_credits > 0:
            logger.info(f"Refunding {job.cost_credits} credits to user {job.user_id} for job {job.id}")
            await add_ledger_entry(
                db, 
                job.user_id, 
                job.cost_credits, 
                reason=f"refund:{status_}", 
                external_id=f"refund_{job.id}"
            )
        
        await db.commit()

    return {"status": "processed"}
