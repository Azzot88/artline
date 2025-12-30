from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.web.routers import auth, public, dashboard, admin, admin_providers, i18n
from app.webhooks import router as webhooks_main
from app.webhooks import stripe as webhooks_stripe

app = FastAPI(title="ArtLine")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(public.router)
app.include_router(auth.router, prefix="", tags=["auth"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(admin_providers.router, prefix="/admin/providers", tags=["providers"])

app.include_router(webhooks_stripe.router, prefix="/stripe", tags=["stripe"])
app.include_router(webhooks_main.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(i18n.router, tags=["i18n"])

@app.get("/health")
def health():
    return {"status": "ok"}
