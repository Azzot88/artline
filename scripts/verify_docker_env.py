#!/usr/bin/env python3
import subprocess
import sys
import time
import json
import urllib.request
import urllib.error
import shutil
import socket

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

# External (Host) Endpoints
HOST_ENDPOINTS = [
    {"name": "Backend Health", "url": "http://localhost:8000/health", "expected_code": 200},
    {"name": "Frontend Health", "url": "http://localhost:3000", "expected_code": 200},
]

# Internal (Container) Endpoints - Fallback if running inside ArtLine network
INTERNAL_ENDPOINTS = [
    {"name": "Backend Internal", "url": "http://web:8000/health", "expected_code": 200},
    {"name": "Frontend Internal", "url": "http://frontend:3000", "expected_code": 200},
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
        return None

def check_docker_available():
    return shutil.which("docker") is not None

def check_container_status(container_name):
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
        print(f"❌ {name:<25} [FAIL] ({e.reason})")
        return False
    except Exception as e:
        print(f"❌ {name:<25} [FAIL] ({e})")
        return False

def check_db_connection_host(container_name, db_user="user"):
    print(f"\nChecking Database Connection ({container_name})...")
    cmd = f"docker exec {container_name} pg_isready -U {db_user}"
    result = run_command(cmd)
    
    if result and "accepting connections" in result:
        print(f"✅ Database accepting connections")
        return True
    else:
        print(f"❌ Database not ready")
        return False

def main():
    print("="*60)
    print("🚀 ArtLine Environment Verification")
    print("="*60)
    
    # 1. Check Execution Context
    if not check_docker_available():
        print("\n⚠️  DOCKER CLI NOT FOUND")
        print("   You seem to be running this script inside a container.")
        print("   Switching to 'Internal Network Mode' to check connectivity between services.\n")
        
        all_ok = True
        print("1. Checking Internal Endpoints...")
        for ep in INTERNAL_ENDPOINTS:
            if not check_endpoint(ep['name'], ep['url'], ep['expected_code']):
                all_ok = False
        
        print("\n" + "="*60)
        if all_ok:
            print("✅ INTERNAL CONNECTIVITY VERIFIED")
            sys.exit(0)
        else:
            print("❌ INTERNAL CONNECTIVITY ISSUES")
            sys.exit(1)

    # 2. Host Mode
    print("\n1. Checking Container Status (Host Mode)...")
    all_containers_ok = True
    for container in CONTAINERS:
        if not check_container_status(container):
            all_containers_ok = False
            
    print("\n2. Checking Services...")
    db_ok = check_db_connection_host("artline-db-1", "postgres")
    
    print("\n3. Checking Host Endpoints...")
    endpoints_ok = True
    for ep in HOST_ENDPOINTS:
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
