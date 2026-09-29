from fastapi import APIRouter
from apps.api.routers.events import get_or_refresh_events

router = APIRouter(prefix="/api/v1", tags=["Official Alerts"])

@router.get("/official-alerts", summary="Get Active Official Government & Emergency Warnings")
async def get_official_alerts():
    """Returns official alerts (WMO CAP, GDACS, NWS) strictly distinguished from TerraGuard AI estimates."""
    events = await get_or_refresh_events()
    official_list = []
    
    for event in events:
        if event.official_warnings:
            for warn in event.official_warnings:
                official_list.append({
                    "alert_id": warn.alert_id,
                    "headline": warn.headline,
                    "severity": warn.severity,
                    "issuing_authority": warn.issuing_authority,
                    "sent_at": warn.sent_at.isoformat(),
                    "url": warn.url,
                    "associated_event_id": event.event_id,
                    "location_name": event.country or event.nearest_populated_location,
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                })
    return {
        "active_official_warnings_count": len(official_list),
        "official_warnings": official_list,
    }
