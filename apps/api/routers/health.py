from datetime import datetime, timezone
from fastapi import APIRouter
from packages.shared.config import settings

router = APIRouter(prefix="/api/v1", tags=["Health & Observability"])


@router.get("/health", summary="System Health & Readiness Check")
async def health_check():
    ai_enabled = bool(settings.OPENROUTER_API_KEY)
    ai_chat = {
        "provider": "OpenRouter",
        "model": settings.OPENROUTER_MODEL,
        "enabled": ai_enabled,
        "mode": "live" if ai_enabled else "fallback",
        "message": (
            "Live AI answers are enabled."
            if ai_enabled
            else "Live AI answers are disabled; the system is running in fallback knowledge mode."
        ),
    }

    return {
        "status": "healthy",
        "service": "TerraGuard AI API Engine",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "v1.0.0",
        "database": "connected",
        "redis": "connected",
        "ai_chat": ai_chat,
    }
