import sys
import os
sys.path.append(os.getcwd())

import asyncio
from app.db.session import async_session
from app.domain.providers.models import AIModel
from sqlalchemy import select

async def main():
    async with async_session() as session:
        result = await session.execute(select(AIModel).where(AIModel.is_active == True))
        models = result.scalars().all()
        
        print(f"Found {len(models)} active models.")
        for m in models:
            schema = m.param_schema
            param_count = len(schema.get("parameters", [])) if schema else 0
            
            print(f"Model: {m.display_name}")
            print(f"  ID: {m.id}")
            print(f"  Param Schema: {schema}")
            print(f"  Param Count: {param_count}")
            print(f"  Capabilities: {m.capabilities}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
