from fastapi import APIRouter, Query
from services.risk_engine.evaluator import calculate_multi_hazard_location_risk
from packages.schemas.hazard import LocationRiskResponse

router = APIRouter(prefix="/api/v1", tags=["Location Risk Assessment"])

@router.get("/location-risk", response_model=LocationRiskResponse, summary="Assess Natural Hazard Risk for Geographic Coordinates")
async def get_location_risk(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate"),
):
    """Returns independent probabilistic risk scores across all 5 hazard categories for a given coordinate."""
    return calculate_multi_hazard_location_risk(lat, lon)
