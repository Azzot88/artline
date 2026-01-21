from fastapi import APIRouter, Request, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import Job, User
from app.domain.billing.service import add_ledger_entry
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
logger = logging.getLogger(__name__)

import httpx
import boto3
import asyncio
from app.core.config import settings

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

    # Find Job
    # We search by provider_job_id
    q = await db.execute(select(Job).where(Job.provider_job_id == provider_job_id))
    job = q.scalar_one_or_none()
    
    if job:
         # print(f"[Generation Flow] Webhook: Matched to Job {job.id}", flush=True)
         pass

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
        
        # Replicate output varies. usually list of URLs for images.
        # For video, might be string or list.
        # We take the first item if list.
        download_url = None
        
        # Save logs if present
        if "logs" in payload:
             job.logs = str(payload["logs"])

        if isinstance(output, list) and len(output) > 0:
            download_url = output[0]
        elif isinstance(output, str):
            download_url = output

                if download_url:
            try:
                # 1. Download Content
                async with httpx.AsyncClient() as client:
                    resp = await client.get(download_url, follow_redirects=True, timeout=60.0)
                    
                    if resp.status_code == 200:
                        file_content = resp.content
                        
                        # 2. Normalize & Upload to S3
                        if settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME:
                            ext = "jpg" # Default normalized format
                            content_to_upload = file_content
                            content_type = "image/jpeg"

                            if job.kind == "video" or ".mp4" in download_url:
                                ext = "mp4"
                                content_type = "video/mp4"
                                job.kind = "video"
                                # TODO: Extract video dimensions if possible
                            else:
                                # Normalize Image to JPG
                                try:
                                    # print("DEBUG: Normalizing image to JPG...", flush=True)
                                    from PIL import Image
                                    import io
                                    with Image.open(io.BytesIO(file_content)) as img:
                                        # Convert RGBA to RGB if needed
                                        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                                            img = img.convert('RGB')
                                        else:
                                            img = img.convert('RGB')
                                        
                                        # Save Dimensions
                                        job.width, job.height = img.size
                                            
                                        output_buffer = io.BytesIO()
                                        img.save(output_buffer, format='JPEG', quality=95)
                                        content_to_upload = output_buffer.getvalue()
                                        # print(f"DEBUG: Normalization complete. Size: {len(content_to_upload)} bytes", flush=True)
                                except Exception as e:
                                    logger.error(f"Image normalization failed: {e}, using original.")
                                    # Fallback to original if PIL fails
                                    content_type = resp.headers.get("content-type", "image/png")
                                    if "webp" in content_type: ext = "webp"
                                    elif "png" in content_type: ext = "png"
                                    elif "jpeg" in content_type: ext = "jpg"
                                    else:
                                        # Emergency fallback to URL check
                                        if ".png" in download_url: ext = "png"; content_type="image/png"
                                        elif ".webp" in download_url: ext = "webp"; content_type="image/webp"
                                        else: ext = "webp"; content_type="image/webp"

                            filename = f"generations/{job.id}.{ext}"
                            
                            def upload_s3(content, bucket, key, mime_type):
                                s3 = boto3.client(
                                    's3',
                                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                                    region_name=settings.AWS_REGION
                                )
                                s3.put_object(
                                    Bucket=bucket,
                                    Key=key,
                                    Body=content,
                                    ContentType=mime_type
                                )
                                return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

                            loop = asyncio.get_event_loop()
                            s3_url = await loop.run_in_executor(
                                None, 
                                upload_s3, 
                                content_to_upload, 
                                settings.AWS_BUCKET_NAME, 
                                filename,
                                content_type
                            )
                            
                            job.result_url = s3_url
                            logger.info(f"Uploaded asset to S3: {s3_url}")
                        else:
                            logger.warning("AWS S3 credentials missing. Using remote URL.")
                            job.result_url = download_url
                            
                    else:
                        logger.error(f"Failed to download asset: {resp.status_code}")
                        job.result_url = download_url # Fallback to remote
                        
            except Exception as e:
                logger.error(f"S3 Upload Exception: {e}")
                job.result_url = download_url # Fallback
        
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
