import asyncio
import json
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models import AIModel

async def check_models():
    async with async_session_factory() as db:
        result = await db.execute(select(AIModel))
        models = result.scalars().all()
        
        print(f"Found {len(models)} models.")
        for m in models:
            print(f"--- Model: {m.display_name} ({m.id}) ---")
            print(f"  Provider: {m.provider}")
            print(f"  Ref: {m.model_ref}")
            print(f"  Type: {m.type}")
            print(f"  UI Config Type: {type(m.ui_config)}")
            print(f"  UI Config: {m.ui_config}")
            print(f"  Caps Type: {type(m.normalized_caps_json)}")
            # print(f"  Caps: {str(m.normalized_caps_json)[:100]}...")

if __name__ == "__main__":
    asyncio.run(check_models())
