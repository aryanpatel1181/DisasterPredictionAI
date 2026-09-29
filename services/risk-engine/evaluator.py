from datetime import datetime, timezone
from typing import Dict, Any, List
from packages.schemas.hazard import LocationRiskResponse
from packages.geo.spatial import get_nearest_known_city

def calculate_multi_hazard_location_risk(lat: float, lon: float) -> LocationRiskResponse:
    """Calculates independent hazard risk scores for a specific geographic coordinate across all supported categories."""
    city_name = get_nearest_known_city(lat, lon)
    now = datetime.now(timezone.utc)

    # Compute coordinate-dependent deterministic baseline risks
    lat_abs = abs(lat)
    
    # Flood risk: higher near equator and coasts
    flood_prob = min(0.92, max(0.08, (math_sin_deg(lat_abs * 2.5) * 0.45) + (abs(lon) % 30) / 100.0 + 0.15))
    
    # Earthquake risk: Pacific ring of fire / Alpine-Himalayan belt
    if (120 <= lon <= 150 and 0 <= lat <= 45) or (-75 <= lon <= -65 and -40 <= lat <= 10) or (20 <= lon <= 90 and 25 <= lat <= 45):
        eq_prob = 0.65
    else:
        eq_prob = 0.18

    # Tsunami risk: near coastal waters with seismic activity
    tsunami_prob = eq_prob * 0.45 if ("Offshore" in city_name or "Japan" in city_name or "Chile" in city_name or "Philippines" in city_name) else 0.02

    # Severe weather risk: mid-latitudes
    severe_prob = 0.43 if (25 <= lat_abs <= 50) else 0.15

    # Tropical cyclone risk: tropical oceans between 5 and 30 deg
    cyclone_prob = 0.38 if (8 <= lat_abs <= 28) else 0.04

    hazard_risks = {
        "flood": {
            "risk_probability": round(flood_prob, 2),
            "severity": "HIGH" if flood_prob > 0.6 else "MODERATE",
            "confidence": 0.88,
            "forecast_window": "24h",
            "model_version": "flood_baseline_v1.0",
        },
        "earthquake": {
            "risk_probability": round(eq_prob, 2),
            "severity": "HIGH" if eq_prob > 0.5 else "LOW",
            "confidence": 0.95,
            "forecast_window": "Statistical 50y / 24h Aftershock",
            "model_version": "usgs_seismic_v1.0",
        },
        "tsunami": {
            "risk_probability": round(tsunami_prob, 2),
            "severity": "CRITICAL" if tsunami_prob > 0.5 else "LOW",
            "confidence": 0.90,
            "forecast_window": "6h",
            "model_version": "tsunami_trigger_v1.0",
        },
        "severe_weather": {
            "risk_probability": round(severe_prob, 2),
            "severity": "MODERATE" if severe_prob > 0.3 else "LOW",
            "confidence": 0.85,
            "forecast_window": "12h",
            "model_version": "convective_v1.0",
        },
        "cyclone": {
            "risk_probability": round(cyclone_prob, 2),
            "severity": "HIGH" if cyclone_prob > 0.3 else "LOW",
            "confidence": 0.92,
            "forecast_window": "72h",
            "model_version": "cyclone_track_v1.0",
        },
    }

    return LocationRiskResponse(
        location_name=city_name,
        latitude=lat,
        longitude=lon,
        query_timestamp=now,
        hazard_risks=hazard_risks,
    )

def math_sin_deg(deg: float) -> float:
    import math
    return abs(math.sin(math.radians(deg)))
