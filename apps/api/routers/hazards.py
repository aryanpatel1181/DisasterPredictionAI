from fastapi import APIRouter, HTTPException, Query
from apps.api.routers.events import get_or_refresh_events

router = APIRouter(prefix="/api/v1", tags=["Hazards"])

SUPPORTED_HAZARDS = ["flood", "earthquake", "tsunami", "severe_weather", "cyclone", "wildfire", "volcano", "landslide", "drought", "extreme_heat", "winter_storm"]

@router.get("/hazards", summary="List All Supported Hazard Categories")
async def list_hazards():
    return {
        "supported_hazards": SUPPORTED_HAZARDS,
        "initial_active_hazards": ["flood", "earthquake", "tsunami", "severe_weather", "cyclone"],
        "future_architecture_hazards": ["wildfire", "volcano", "landslide", "drought", "extreme_heat", "winter_storm"],
    }

@router.get("/hazards/{hazard_type}", summary="Get Events & Metrics for Specific Hazard Type")
async def get_hazard_by_type(hazard_type: str, limit: int = Query(50, ge=1, le=500)):
    if hazard_type not in SUPPORTED_HAZARDS:
        raise HTTPException(status_code=404, detail=f"Hazard type '{hazard_type}' is not recognized.")

    all_events = await get_or_refresh_events()
    matching = [e.model_dump() for e in all_events if e.hazard_type.value == hazard_type]
    
    return {
        "hazard_type": hazard_type,
        "total_active_events": len(matching),
        "events": matching[:limit],
    }
