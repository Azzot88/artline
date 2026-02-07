import sys
import os
import time
import importlib

# Add project root to path
sys.path.append(os.getcwd())

def measure_import(module_name):
    start_time = time.time()
    try:
        print(f"[{time.strftime('%H:%M:%S')}] Importing {module_name}...", end=" ", flush=True)
        importlib.import_module(module_name)
        elapsed = time.time() - start_time
        print(f"OK ({elapsed:.4f}s)")
        return True
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"FAILED ({elapsed:.4f}s)")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

print("--- Starting Import Verification ---")
start_total = time.time()

modules_to_check = [
    "app.core.config",
    "app.core.db",
    "app.models",
    "app.schemas",
    "app.core.deps",
    "app.domain.users.guest_service",
    "app.domain.billing.service",
    "app.domain.jobs.service",
    "app.domain.analytics.service",
    "boto3",
    "app.web.routers.api_spa"
]

all_passed = True
for mod in modules_to_check:
    if not measure_import(mod):
        all_passed = False
        break

total_elapsed = time.time() - start_total
print("----------------------------------")
if all_passed:
    print(f"SUCCESS: All modules imported in {total_elapsed:.4f}s")
else:
    print(f"FAILURE: Stopped after {total_elapsed:.4f}s")
