from fastapi import APIRouter, Request, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models import Job, User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

import httpx
import os
import boto3
import asyncio
from app.core.config import settings

# ...

@router.post("/webhooks/replicate")
async def replicate_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    payload = await request.json()
    logger.info(f"Replicate Webhook Received: {payload.get('id')} - {payload.get('status')}")
    
    provider_job_id = payload.get("id")
    status = payload.get("status")
    output = payload.get("output")
    error = payload.get("error")
    
    if not provider_job_id:
        return {"ok": False, "reason": "No ID"}
        
    result = await db.execute(select(Job).where(Job.provider_job_id == provider_job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        logger.warning(f"Job not found for provider_id: {provider_job_id}")
        return {"ok": False, "reason": "Job not found"}
        
    if status == "succeeded":
        job.status = "succeeded"
        
        # Determine URL to download
        download_url = None
        if isinstance(output, list) and len(output) > 0:
            download_url = output[0]
        elif isinstance(output, str):
            download_url = output
            
        if download_url:
            try:
                # DEBUG LOGGING - Using print to force stdout
                print(f"DEBUG: Processing succeeded job {job.id}", flush=True)
                print(f"DEBUG: AWS Config Check - Bucket: {settings.AWS_BUCKET_NAME}, Region: {settings.AWS_REGION}, KeyID Present: {bool(settings.AWS_ACCESS_KEY_ID)}", flush=True)

                # 1. Download Content
                async with httpx.AsyncClient() as client:
                    resp = await client.get(download_url, follow_redirects=True, timeout=60.0)
                    
                    if resp.status_code == 200:
                        file_content = resp.content
                        print(f"DEBUG: Downloaded {len(file_content)} bytes", flush=True)
                        
                        # 2. Upload to S3
                        if settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME:
                            ext = "png" # Default
                            if job.kind == "video":
                                ext = "mp4"
                            elif ".webp" in download_url:
                                ext = "webp"
                            elif ".jpg" in download_url:
                                ext = "jpg"
                                
                            filename = f"generations/{job.id}.{ext}"
                            print(f"DEBUG: Attempting S3 upload to {filename}", flush=True)
                            
                            def upload_s3(content, bucket, key):
                                try:
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
                                        ContentType=f"image/{ext}" if ext != "mp4" else "video/mp4",

                                    )
                                    return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
                                except Exception as e:
                                    print(f"DEBUG: Boto3 inner exception: {e}", flush=True)
                                    raise e

                            loop = asyncio.get_event_loop()
                            s3_url = await loop.run_in_executor(
                                None, 
                                upload_s3, 
                                file_content, 
                                settings.AWS_BUCKET_NAME, 
                                filename
                            )
                            
                            job.result_url = s3_url
                            print(f"DEBUG: Upload success: {s3_url}", flush=True)
                            logger.info(f"Uploaded asset to S3: {s3_url}")
                        else:
                            print("DEBUG: AWS Config missing in IF check", flush=True)
                            logger.warning("AWS S3 credentials missing. Using remote URL.")
                            job.result_url = download_url
                            
                    else:
                        print(f"Failed to download asset: {resp.status_code}", flush=True)
                        job.result_url = download_url # Fallback to remote
                        
            except Exception as e:
                print(f"S3 Upload Exception (Outer): {e}", flush=True)
                job.result_url = download_url # Fallback
        
    elif status == "failed":
        job.status = "failed"
        job.error_message = str(error) if error else "Unknown error from provider"
        
    elif status == "canceled":
        job.status = "failed"
        job.error_message = "Canceled by provider/user"
        
    await db.commit()
    
    return {"ok": True}
