
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import uuid

class GuestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        # Check if guest_id cookie exists in REQUEST
        if not request.cookies.get("guest_id"):
            # Check if guest_id cookie is being set in RESPONSE (by login/init endpoints)
            # Starlette responses put simple cookies in headers. 
            # We look for "guest_id" in Set-Cookie headers.
            cookie_set = False
            for header in response.headers.getlist("set-cookie"):
                if "guest_id=" in header:
                    cookie_set = True
                    break
            
            if not cookie_set:
                # If not, create one and set it
                guest_id = str(uuid.uuid4())
                response.set_cookie(
                    key="guest_id",
                    value=guest_id,
                    max_age=365 * 24 * 60 * 60, # 1 year
                    samesite="lax",
                    httponly=True
                )
            # Also inject into request scope so same-request processing *could* see it?
            # Standard middleware pattern: can't easily modify request cookies for downstream dependencies 
            # unless we modify request.cookies (which is immutable usually) or scope.
            # But deps.py reads request.cookies.
            # Dependencies run BEFORE middleware response processing but AFTER middleware request processing.
            # So if we want deps to see it, we must add it to request BEFORE 'call_next'.
            
        return response
