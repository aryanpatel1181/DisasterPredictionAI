from typing import List
from fastapi import APIRouter
from services.ingestion.ingestion_manager import ingestion_manager
from packages.schemas.providers import ProviderHealthStatus

router = APIRouter(prefix="/api/v1", tags=["Data Sources & Health"])

@router.get("/sources/status", response_model=List[ProviderHealthStatus], summary="Get Provider Adapter Health Status")
async def get_sources_status():
    """Returns telemetry status, latency, error counts, and last success timestamps for all data ingestion adapters."""
    return ingestion_manager.get_sources_status()
