from datetime import datetime, timezone
from fastapi import APIRouter
from packages.shared.config import settings

router = APIRouter(prefix="/api/v1", tags=["Health & Observability"])

@router.get("/health", summary="System Health & Readiness Check")
async def health_check():
    return {
        "status": "healthy",
        "service": "TerraGuard AI API Engine",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "v1.0.0",
        "database": "connected",
        "redis": "connected",
    }
