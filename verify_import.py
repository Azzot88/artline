import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.web.routers.api_spa...")
    from app.web.routers import api_spa
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
