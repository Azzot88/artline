"""
Celery tasks for email verification cleanup and reminders.
Scheduled tasks for:
- Sending reminder emails (3 days, 15 days after registration)
- Deleting unverified accounts (30 days after registration)
"""

from celery import shared_task
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models import User, Job
from app.core.config import settings
from app.domain.users.email_service import send_reminder_email
import boto3
from urllib.parse import urlparse


@shared_task(name="send_email_verification_reminders")
def send_email_verification_reminders():
    """
    Daily task to send reminder emails to unverified users.
    - 3 days after registration: first reminder
    - 15 days after registration: final reminder
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Find users needing 3-day reminder
        three_days_ago = now - timedelta(days=3)
        stmt_3d = select(User).where(
            User.is_email_verified == False,
            User.email_verification_reminder_3d_sent == False,
            User.created_at <= three_days_ago
        )
        users_3d = db.execute(stmt_3d).scalars().all()
        
        for user in users_3d:
            try:
                # Send reminder (27 days left until deletion)
                import asyncio
                asyncio.run(send_reminder_email(
                    email=user.email,
                    days_left=27,  # 30 - 3 = 27
                    language=user.language
                ))
                user.email_verification_reminder_3d_sent = True
                db.commit()
                print(f"Sent 3-day reminder to {user.email}")
            except Exception as e:
                print(f"Failed to send 3-day reminder to {user.email}: {e}")
                db.rollback()
        
        # Find users needing 15-day reminder
        fifteen_days_ago = now - timedelta(days=15)
        stmt_15d = select(User).where(
            User.is_email_verified == False,
            User.email_verification_reminder_15d_sent == False,
            User.created_at <= fifteen_days_ago
        )
        users_15d = db.execute(stmt_15d).scalars().all()
        
        for user in users_15d:
            try:
                # Send final reminder (15 days left until deletion)
                import asyncio
                asyncio.run(send_reminder_email(
                    email=user.email,
                    days_left=15,  # 30 - 15 = 15
                    language=user.language
                ))
                user.email_verification_reminder_15d_sent = True
                db.commit()
                print(f"Sent 15-day reminder to {user.email}")
            except Exception as e:
                print(f"Failed to send 15-day reminder to {user.email}: {e}")
                db.rollback()
        
        print(f"Reminder task completed: {len(users_3d)} 3-day, {len(users_15d)} 15-day reminders sent")
        
    finally:
        db.close()


@shared_task(name="delete_unverified_accounts")
def delete_unverified_accounts():
    """
    Daily task to delete accounts that have not verified email within 30 days.
    Cascade deletes jobs and archives S3 files.
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=settings.ACCOUNT_DELETION_DAYS)
        
        # Find unverified users older than 30 days
        stmt = select(User).where(
            User.is_email_verified == False,
            User.created_at <= thirty_days_ago
        )
        users_to_delete = db.execute(stmt).scalars().all()
        
        for user in users_to_delete:
            try:
                print(f"Deleting unverified account: {user.email} (created {user.created_at})")
                
                # Get all jobs for S3 archiving
                jobs_stmt = select(Job).where(Job.user_id == user.id)
                jobs = db.execute(jobs_stmt).scalars().all()
                
                # Archive S3 files
                s3_keys_to_archive = []
                for job in jobs:
                    if job.result_url:
                        try:
                            path = urlparse(job.result_url).path.lstrip('/')
                            if path:
                                s3_keys_to_archive.append(path)
                        except Exception as e:
                            print(f"Failed to parse S3 URL for job {job.id}: {e}")
                
                # Archive all S3 files
                if s3_keys_to_archive and settings.AWS_ACCESS_KEY_ID:
                    _archive_s3_files(s3_keys_to_archive)
                
                # Delete user (cascade will delete jobs, ledger entries, etc.)
                db.delete(user)
                db.commit()
                
                print(f"Deleted unverified account {user.email} with {len(jobs)} jobs")
                
            except Exception as e:
                print(f"Failed to delete user {user.email}: {e}")
                db.rollback()
        
        print(f"Deletion task completed: {len(users_to_delete)} accounts deleted")
        
    finally:
        db.close()


def _archive_s3_files(keys: list[str]):
    """Archive S3 files to 'deleted/' prefix (sync operation for Celery)"""
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        for key in keys:
            try:
                source = {'Bucket': settings.AWS_BUCKET_NAME, 'Key': key}
                dest_key = f"deleted/{key}"
                
                # Copy to deleted folder
                s3.copy_object(CopySource=source, Bucket=settings.AWS_BUCKET_NAME, Key=dest_key)
                
                # Delete original
                s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=key)
                
                print(f"Archived S3 object: {key} -> {dest_key}")
            except Exception as e:
                print(f"Failed to archive S3 object {key}: {e}")
                
    except Exception as e:
        print(f"Failed to initialize S3 client for archiving: {e}")
