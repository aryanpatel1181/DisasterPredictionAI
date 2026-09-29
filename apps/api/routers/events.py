from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from services.ingestion.ingestion_manager import ingestion_manager
from services.risk_engine.predictive_pipeline import predictor
from packages.schemas.hazard import NormalizedHazardEvent
from packages.geo.spatial import cluster_points, is_point_in_bbox

router = APIRouter(prefix="/api/v1", tags=["Hazard Events"])

_cached_events: List[NormalizedHazardEvent] = []

async def get_or_refresh_events() -> List[NormalizedHazardEvent]:
    global _cached_events
    # Fetch live telemetry observations & official alerts
    obs_events = await ingestion_manager.fetch_all_events()
    
    # Generate live upcoming AI risk predictions from trained ML models
    ai_predictions = predictor.generate_upcoming_disaster_predictions()

    # Combine observations, warnings, and AI risk estimates
    all_events = obs_events + ai_predictions
    _cached_events = all_events
    return _cached_events

@router.get("/events", summary="List Active Hazard Events & AI Predictions")
async def list_events(
    hazard_type: Optional[str] = Query(None, description="Filter by hazard type: flood, earthquake, tsunami, severe_weather, cyclone"),
    status: Optional[str] = Query(None, description="Filter by status: OBSERVED, FORECAST, AI_RISK_ESTIMATE, OFFICIAL_WARNING"),
    min_severity: Optional[str] = Query(None, description="Filter by minimum severity: LOW, MODERATE, HIGH, CRITICAL"),
    min_probability: Optional[float] = Query(0.0, ge=0.0, le=1.0, description="Minimum risk probability threshold"),
    bbox: Optional[str] = Query(None, description="Bounding box filter: min_lon,min_lat,max_lon,max_lat"),
    enable_clustering: bool = Query(True, description="Enable spatial clustering for large point collections"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    events = await get_or_refresh_events()

    if hazard_type:
        events = [e for e in events if e.hazard_type.value == hazard_type]
    
    if status:
        events = [e for e in events if e.status.value == status]

    if min_probability > 0.0:
        events = [e for e in events if e.risk_probability >= min_probability]

    if bbox:
        try:
            coords = [float(x.strip()) for x in bbox.split(",")]
            events = [e for e in events if is_point_in_bbox(e.latitude, e.longitude, coords)]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox parameter format. Expected min_lon,min_lat,max_lon,max_lat")

    if enable_clustering and len(events) > 30:
        raw_dicts = [e.model_dump() for e in events]
        clustered = cluster_points(raw_dicts, grid_size_deg=3.0)
        return {
            "total_count": len(events),
            "returned_count": len(clustered),
            "is_clustered": True,
            "events": clustered[offset : offset + limit],
        }

    return {
        "total_count": len(events),
        "returned_count": len(events[offset : offset + limit]),
        "is_clustered": False,
        "events": [e.model_dump() for e in events[offset : offset + limit]],
    }

@router.get("/events/{event_id}", response_model=NormalizedHazardEvent, summary="Get Detailed Hazard Event or Prediction")
async def get_event_by_id(event_id: str):
    events = await get_or_refresh_events()
    for e in events:
        if e.event_id == event_id:
            return e
    raise HTTPException(status_code=404, detail=f"Hazard event or prediction with ID '{event_id}' not found.")
