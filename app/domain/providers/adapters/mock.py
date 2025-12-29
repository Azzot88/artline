import asyncio
import random
import uuid

class MockProvider:
    """
    Simulates an external API for image/video generation.
    """
    
    @staticmethod
    async def submit_job(kind: str, prompt: str) -> str:
        # Simulate network latency
        await asyncio.sleep(0.5) 
        # Return a pretend provider ID
        return f"mock-{uuid.uuid4()}"

    @staticmethod
    async def poll_status(provider_id: str) -> dict:
        """
        Returns { "status": ..., "progress": ..., "result": ..., "error": ... }
        Possible statuses: "queued", "processing", "completed", "failed"
        """
        # In a real app, we'd query the provider API.
        # Here we just fake it based on some deterministic or random logic,
        # OR state is handled by the worker keeping track of time.
        # Since the worker is stateful about the job DB, we can just let the worker
        # increment progress blindly for this mock.
        
        # However, interface says poll(id). 
        # Making this purely stateless random is chaotic, but sufficient for MVP check.
        # Better: The worker manages the "mocking" of progress itself, 
        # but the prompt asked for a provider interface.
        
        pass 
        # Implementation is actually handled inside the worker logic for the mock
        # because the provider doesn't store state. 
        # We will implement the Logic in job_runner.py to simulate "Polling" 
        # by checking elapsed time relative to job.created_at or similar.

# For standard interface compliance:
async def submit_to_provider(kind: str, prompt: str) -> str:
    return await MockProvider.submit_job(kind, prompt)
