from fastapi import APIRouter, Request, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import Job, User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/webhooks/replicate")
async def replicate_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    payload = await request.json()
    logger.info(f"Replicate Webhook Received: {payload.get('id')} - {payload.get('status')}")
    
    # Payload structure from Replicate:
    # { "id": "...", "status": "succeeded", "output": "...", "error": null, ... }
    
    provider_job_id = payload.get("id")
    status = payload.get("status")
    output = payload.get("output")
    error = payload.get("error")
    
    if not provider_job_id:
        return {"ok": False, "reason": "No ID"}
        
    # Find Job
    # We stored provider_job_id in job.provider_job_id
    result = await db.execute(select(Job).where(Job.provider_job_id == provider_job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        logger.warning(f"Job not found for provider_id: {provider_job_id}")
        return {"ok": False, "reason": "Job not found"}
        
    # Update Status
    # Replicate statuses: starting, processing, succeeded, failed, canceled
    
    if status == "succeeded":
        job.status = "succeeded"
        # Output can be list or string depending on model
        if isinstance(output, list) and len(output) > 0:
            job.result_url = output[0] # Take first for now
        elif isinstance(output, str):
            job.result_url = output
            
    elif status == "failed":
        job.status = "failed"
        job.error_message = str(error) if error else "Unknown error from provider"
        
    elif status == "canceled":
        job.status = "failed" # or canceled
        job.error_message = "Canceled by provider/user"
        
    # Commit
    await db.commit()
    
    return {"ok": True}
