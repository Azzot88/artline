
import pytest
import boto3
import uuid
import os
from botocore.exceptions import ClientError

@pytest.mark.live
def test_s3_write_access():
    """
    LIVE TEST: Verifies AWS S3 Write Access.
    Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION in env.
    
    1. Uploads a text file to S3.
    2. Checks if it exists.
    3. Deletes it.
    """
    
    # 1. Check Env
    required_vars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME", "AWS_REGION"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        pytest.skip(f"Skipping S3 live test. Missing env vars: {', '.join(missing)}")

    bucket_name = os.getenv("AWS_BUCKET_NAME")
    region = os.getenv("AWS_REGION")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=region
    )
    
    test_filename = f"test_write_access_{uuid.uuid4()}.txt"
    test_content = b"ArtLine S3 Live Test - Success"
    
    print(f"Attempting to upload {test_filename} to {bucket_name}...")
    
    try:
        # 2. Upload
        s3.put_object(
            Bucket=bucket_name,
            Key=test_filename,
            Body=test_content,
            ContentType="text/plain",

        )
        
        # 3. Verify (Head Object)
        s3.head_object(Bucket=bucket_name, Key=test_filename)
        print("Upload verified successful.")
        
        # 4. Generate URL (Optional verify)
        url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{test_filename}"
        print(f"File URL: {url}")
        
    except ClientError as e:
        pytest.fail(f"S3 Operation Failed: {e}")
        
    finally:
        # 5. Cleanup
        try:
            s3.delete_object(Bucket=bucket_name, Key=test_filename)
            print("Cleanup successful.")
        except Exception as e:
            print(f"Warning: Failed to delete test file: {e}")
