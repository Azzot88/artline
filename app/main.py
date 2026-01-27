from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.web.routers import i18n
from app.webhooks import router as webhooks_main
from app.webhooks import stripe as webhooks_stripe
from app.core.monitoring import setup_monitoring_handler

app = FastAPI(title="ArtLine")

@app.on_event("startup")
async def startup_event():
    setup_monitoring_handler()

from app.web.middleware.guest import GuestMiddleware
app.add_middleware(GuestMiddleware)

app.include_router(webhooks_stripe.router, prefix="/stripe", tags=["stripe"])
app.include_router(webhooks_main.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(i18n.router, tags=["i18n"])

from app.web.routers import api_spa, admin
from fastapi import Request
from fastapi.responses import JSONResponse

app.include_router(api_spa.router, prefix="/api", tags=["spa"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.exception_handler(Exception)
async def api_exception_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api"):
        # Generic fallback
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "internal_error", "message": str(exc)}}
        )
    # Default behavior for HTML routes (Starlette/FastAPI handles it)
    raise exc


@app.get("/health")
def health():
    return {"status": "ok"}
