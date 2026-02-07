#!/usr/bin/env python3
import subprocess
import sys
import time
import json
import urllib.request
import urllib.error

# Configuration
CONTAINERS = [
    "artline-web-1",
    "artline-frontend-1",
    "artline-db-1",
    "artline-redis-1",
    "artline-worker-1",
    "artline-celery-beat-1",
    "artline-nginx-1"
]

ENDPOINTS = [
    {"name": "Backend Health", "url": "http://localhost:8000/health", "expected_code": 200},
    {"name": "Frontend Health", "url": "http://localhost:3000", "expected_code": 200}, # Assuming exposed on 3000 internal or host
    # Adjust ports if mapped differently in docker-compose.prod.yml
]

def run_command(command):
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command '{command}': {e.stderr}")
        return None

def check_container_status(container_name):
    # Check if container is running
    cmd = f"docker inspect -f '{{{{.State.Status}}}}' {container_name}"
    status = run_command(cmd)
    
    if status == "running":
        print(f"✅ {container_name:<25} [RUNNING]")
        return True
    else:
        print(f"❌ {container_name:<25} [{status or 'MISSING'}]")
        return False

def check_endpoint(name, url, expected_code):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.getcode()
            if code == expected_code:
                print(f"✅ {name:<25} [OK] ({code})")
                return True
            else:
                print(f"❌ {name:<25} [FAIL] (Expected {expected_code}, got {code})")
                return False
    except urllib.error.URLError as e:
        print(f"❌ {name:<25} [FAIL] ({e})")
        return False
    except Exception as e:
        print(f"❌ {name:<25} [FAIL] ({e})")
        return False

def check_db_connection(container_name, db_user="user", db_name="artline"):
    print(f"\nChecking Database Connection ({container_name})...")
    # Simple query to check if DB is ready
    cmd = f"docker exec {container_name} pg_isready -U {db_user}"
    result = run_command(cmd)
    
    if result and "accepting connections" in result:
        print(f"✅ Database accepting connections")
        return True
    else:
        print(f"❌ Database not ready: {result}")
        return False

def main():
    print("="*60)
    print("🚀 ArtLine Server-Side Verification")
    print("="*60)
    
    # 1. Check Container Status
    print("\n1. Checking Container Status...")
    all_containers_ok = True
    for container in CONTAINERS:
        if not check_container_status(container):
            all_containers_ok = False
            
    # 2. Check Database
    print("\n2. Checking Services...")
    db_ok = check_db_connection("artline-db-1", "postgres") # Adjust user if needed
    
    # 3. Check Endpoints
    # Note: This assumes the script runs on the host where ports are mapped.
    # If using nginx proxy, might need to check localhost:80 or specific mapped ports.
    print("\n3. Checking Endpoints (localhost)...")
    endpoints_ok = True
    # We might need to inspect docker port mappings if localhost fails, but let's try defaults first
    # Or assuming docker network calls internal? No, verifying from Host.
    
    # Let's dynamically find ports if possible or stick to defaults
    # For now, trying default mapped ports: 8000 (API) and 80/3000 (Web)
    # If verifying from *inside* a container, URLs would be http://artline-web:8000
    
    # Assuming Host Execution:
    for ep in ENDPOINTS:
         if not check_endpoint(ep['name'], ep['url'], ep['expected_code']):
             endpoints_ok = False

    print("\n" + "="*60)
    if all_containers_ok and db_ok and endpoints_ok:
        print("✅ DEPLOYMENT VERIFIED: SYSTEM IS HEALTHY")
        sys.exit(0)
    else:
        print("⚠️  DEPLOYMENT ISSUES DETECTED")
        sys.exit(1)

if __name__ == "__main__":
    main()
