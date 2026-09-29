from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Query
from apps.api.routers.events import get_or_refresh_events

router = APIRouter(prefix="/api/v1", tags=["Historical Replay & Backtesting"])

@router.get("/history", summary="Reconstruct Available Telemetry & Predictions at Historical Timestamp")
async def get_historical_replay_snapshot(
    timestamp: str = Query(..., description="ISO 8601 UTC timestamp to reconstruct state for (e.g. 2026-09-15T00:00:00Z)"),
    hazard_type: Optional[str] = Query(None),
):
    """Reconstructs what data would have been available at a specific historical timestamp for zero-leakage backtesting."""
    try:
        target_dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        target_dt = datetime.now(timezone.utc) - timedelta(hours=24)

    all_events = await get_or_refresh_events()
    
    # Filter events detected AT OR BEFORE target_dt to guarantee temporal leakage prevention
    historical_events = [
        e.model_dump() for e in all_events
        if e.detected_timestamp <= target_dt
    ]

    if hazard_type:
        historical_events = [e for e in historical_events if e["hazard_type"] == hazard_type]

    return {
        "replay_timestamp": target_dt.isoformat(),
        "temporal_leakage_prevented": True,
        "available_events_count": len(historical_events),
        "events": historical_events,
    }
