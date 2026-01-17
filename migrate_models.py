import asyncio
import json
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models import AIModel

async def migrate_models():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AIModel))
        models = result.scalars().all()
        
        print(f"Found {len(models)} models. Starting migration...")
        
        for m in models:
            old_config = m.ui_config or {}
            new_params = {}
            
            # Case 1: Already migrated (has 'parameters' key)
            if 'parameters' in old_config:
                print(f"Skipping {m.display_name} (already migrated)")
                continue

            # Case 2: Intermediate 'hidden_inputs' structure
            if 'hidden_inputs' in old_config:
                print(f"Migrating {m.display_name} from Intermediate structure...")
                # We can't recover much here easily, but let's try
                # This structure {hidden_inputs: [], defaults: {}, ...} is what we were moving AWAY from
                # to { parameters: { paramName: ExposureConfig } }
                
                # We will just init empty parameters for now, as the intermediate struct didn't have full data
                # Or we could try to map it if needed, but the provided dump showed empty lists mainly.
                m.ui_config = { "parameters": {} }
                continue

            # Case 3: Legacy Flat Structure (e.g. Flux, Veo)
            # { 'seed': {'visible': True, ...} }
            print(f"Migrating {m.display_name} from Legacy structure...")
            for param_name, details in old_config.items():
                if isinstance(details, dict):
                    new_params[param_name] = {
                        "enabled": details.get("visible", True),
                        "default": details.get("default"),
                        # Map other legacy fields if present
                        "custom_label": details.get("label"),
                    }
                    
                    # Map range/enum if they exist in legacy
                    allowed_range = {}
                    if "min" in details: allowed_range["min"] = details["min"]
                    if "max" in details: allowed_range["max"] = details["max"]
                    if len(allowed_range) > 0:
                        new_params[param_name]["allowed_range"] = allowed_range
                        
            m.ui_config = { "parameters": new_params }
            # flag as dirty for commit
        
        await db.commit()
        print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate_models())
