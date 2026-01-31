from fastapi import APIRouter, Request, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import Job, User
from app.domain.billing.service import add_ledger_entry
import logging
import httpx
import boto3
import asyncio
from app.core.config import settings
from app.domain.providers.replicate.response_normalizer import ReplicateResponseNormalizer
from app.domain.providers.normalization.media_processor import MediaProcessor

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/replicate")
async def replicate_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle incoming webhooks from Replicate.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # 1. Normalize Response (Runtime Normalization)
    normalizer = ReplicateResponseNormalizer()
    normalized = normalizer.normalize_job_response(payload)
    
    provider_job_id = normalized.get("provider_job_id")
    status_ = normalized.get("status")
    result_url = normalized.get("result_url")
    error = normalized.get("error_message")

    if not provider_job_id:
        return {"status": "ignored", "reason": "no_id"}

    logger.info(f"Webhook received for {provider_job_id}: {status_}")

    # 2. Find Job
    q = await db.execute(select(Job).where(Job.provider_job_id == provider_job_id))
    job = q.scalar_one_or_none()

    if not job:
        logger.warning(f"Job not found for provider_id {provider_job_id}")
        return {"status": "ignored", "reason": "job_not_found"}

    # Idempotency Check
    if job.status in ["succeeded", "failed"]:
        logger.info(f"Job {job.id} already {job.status}. Ignoring webhook.")
        return {"status": "ignored", "reason": "already_terminal"}

    # Update Job
    if status_ == "succeeded":
        job.status = "succeeded"
        job.progress = 100
        if normalized.get("logs"):
             job.logs = normalized["logs"]
        
        if result_url:
            try:
                # 3. Download & Process
                async with httpx.AsyncClient() as client:
                    resp = await client.get(result_url, follow_redirects=True, timeout=60.0)
                    
                    if resp.status_code == 200:
                        file_content = resp.content
                        processor = MediaProcessor()
                        
                        # 4. Normalize/Optimize & Upload
                        if settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME:
                            ext = "jpg"
                            content_to_upload = file_content
                            content_type = "image/jpeg"

                            if job.kind == "video" or ".mp4" in result_url:
                                ext = "mp4"
                                content_type = "video/mp4"
                                job.kind = "video"
                                # TODO: Use processor.generate_video_thumbnail here if needed
                            else:
                                # Optimize Image
                                try:
                                    content_to_upload = processor.optimize_image(file_content, "JPEG")
                                    w, h = processor.get_image_dimensions(file_content)
                                    job.width = w
                                    job.height = h
                                except Exception as e:
                                    logger.error(f"Image optimization failed: {e}, using original.")
                                    content_type = resp.headers.get("content-type", "image/png")
                                    if "png" in content_type: ext = "png"
                                    elif "webp" in content_type: ext = "webp"
                                    
                            filename = f"generations/{job.id}.{ext}"
                            
                            def upload_s3(content, bucket, key, mime_type):
                                s3 = boto3.client(
                                    's3',
                                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                                    region_name=settings.AWS_REGION
                                )
                                s3.put_object(Bucket=bucket, Key=key, Body=content, ContentType=mime_type)
                                return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

                            loop = asyncio.get_event_loop()
                            s3_url = await loop.run_in_executor(
                                None, upload_s3, content_to_upload, settings.AWS_BUCKET_NAME, filename, content_type
                            )
                            job.result_url = s3_url
                            logger.info(f"Uploaded asset to S3: {s3_url}")
                        else:
                            logger.warning("AWS S3 credentials missing. Using remote URL.")
                            job.result_url = result_url
                    else:
                        logger.error(f"Failed to download asset: {resp.status_code}")
                        job.result_url = result_url
            except Exception as e:
                logger.error(f"Processing Exception: {e}")
                job.result_url = result_url
        
        await db.commit()
    
    elif status_ in ["failed", "canceled"]:
        job.status = "failed"
        job.error_message = error or "Unknown error"
        
        # REFUND
        if job.cost_credits > 0:
            logger.info(f"Refunding {job.cost_credits} for job {job.id}")
            await add_ledger_entry(
                db, job.user_id, job.cost_credits, 
                reason=f"refund:{status_}", 
                external_id=f"refund_{job.id}"
            )
        await db.commit()

    return {"status": "processed"}
