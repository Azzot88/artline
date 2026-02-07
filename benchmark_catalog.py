import asyncio
import time
import sys
import os
from typing import Dict, Any

sys.path.append(os.getcwd())

from app.domain.catalog.service import CatalogService
from app.domain.providers.models import AIModel

# Mock Data
MOCK_SCHEMA = {
    "openapi": "3.0.0",
    "paths": {
        "/predict": {
            "post": {
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "prompt": {"type": "string"},
                                    "seed": {"type": "integer"},
                                    "width": {"type": "integer"},
                                    "height": {"type": "integer"}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

MOCK_CONFIG = {
    "parameters": {
        "width": {"default": 1024},
        "height": {"default": 1024}
    }
}

async def benchmark():
    print("--- Benchmarking CatalogService ---")
    
    # 1. Init
    start = time.time()
    service = CatalogService()
    print(f"Service Init: {time.time() - start:.4f}s")
    
    # 2. Mock Model
    model = AIModel(
        id="test-model",
        raw_schema_json=MOCK_SCHEMA,
        ui_config=MOCK_CONFIG,
        is_active=True
    )
    
    # 3. Resolve Spec (Single)
    start = time.time()
    service.resolve_ui_spec(model)
    print(f"Single Resolution: {time.time() - start:.4f}s")
    
    # 4. Resolve Spec (Multiple 50x)
    start = time.time()
    for _ in range(50):
        service.resolve_ui_spec(model)
    elapsed = time.time() - start
    print(f"50x Resolution: {elapsed:.4f}s (Avg: {elapsed/50:.4f}s)")
    
    print("-----------------------------------")

if __name__ == "__main__":
    asyncio.run(benchmark())
