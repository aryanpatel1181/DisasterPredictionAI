import math
from typing import List, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def is_point_in_bbox(lat: float, lon: float, bbox: List[float]) -> bool:
    """Check if point is inside bounding box [min_lon, min_lat, max_lon, max_lat]."""
    if len(bbox) != 4:
        return True
    min_lon, min_lat, max_lon, max_lat = bbox
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon

def cluster_points(
    features: List[Dict[str, Any]], grid_size_deg: float = 2.0
) -> List[Dict[str, Any]]:
    """Group spatial features into spatial grid clusters to prevent browser map overloading."""
    clusters: Dict[str, List[Dict[str, Any]]] = {}
    for feat in features:
        lat = feat.get("latitude")
        lon = feat.get("longitude")
        if lat is None or lon is None:
            continue
        grid_key = f"{round(lat / grid_size_deg) * grid_size_deg:.1f}_{round(lon / grid_size_deg) * grid_size_deg:.1f}"
        clusters.setdefault(grid_key, []).append(feat)

    result = []
    for key, items in clusters.items():
        if len(items) == 1:
            result.append(items[0])
        else:
            avg_lat = sum(i["latitude"] for i in items) / len(items)
            avg_lon = sum(i["longitude"] for i in items) / len(items)
            max_risk = max(i.get("risk_probability", 0.0) for i in items)
            primary_hazard = items[0].get("hazard_type", "hazard")
            result.append({
                "event_id": f"cluster_{key}",
                "hazard_type": primary_hazard,
                "status": "OBSERVED",
                "latitude": avg_lat,
                "longitude": avg_lon,
                "geometry": {"type": "Point", "coordinates": [avg_lon, avg_lat]},
                "is_cluster": True,
                "cluster_count": len(items),
                "risk_probability": max_risk,
                "country": items[0].get("country", "Global"),
                "admin_region": f"{len(items)} clustered events",
                "nearest_populated_location": f"Cluster of {len(items)} events around ({avg_lat:.2f}, {avg_lon:.2f})",
                "clustered_events": items,
            })
    return result

def get_nearest_known_city(lat: float, lon: float) -> str:
    """Universal spatial reference resolution for any coordinate globally."""
    GLOBAL_REFERENCE_POINTS = [
        ("Ahmedabad, Gujarat, India", 23.0225, 72.5714),
        ("Chicago, Illinois, USA", 41.8781, -87.6298),
        ("Tokyo, Japan", 35.6762, 139.6503),
        ("Jakarta, Indonesia", -6.2088, 106.8456),
        ("Manila, Philippines", 14.5995, 120.9842),
        ("San Francisco, USA", 37.7749, -122.4194),
        ("Los Angeles, USA", 34.0522, -118.2437),
        ("London, UK", 51.5074, -0.1278),
        ("Paris, France", 48.8566, 2.3522),
        ("Cairo, Egypt", 30.0444, 31.2357),
        ("Mumbai, India", 19.0760, 72.8777),
        ("Delhi, India", 28.6139, 77.2090),
        ("Shanghai, China", 31.2304, 121.4737),
        ("Santiago, Chile", -33.4489, -70.6693),
        ("Mexico City, Mexico", 19.4326, -99.1332),
        ("Istanbul, Turkey", 41.0082, 28.9784),
        ("Kathmandu, Nepal", 27.7172, 85.3240),
        ("Wellington, New Zealand", -41.2865, 174.7762),
        ("Miami, USA", 25.7617, -80.1918),
        ("Dhaka, Bangladesh", 23.8103, 90.4125),
        ("New Orleans, USA", 29.9511, -90.0715),
        ("Lima, Peru", -12.0463, -77.0428),
        ("Reykjavik, Iceland", 64.1466, -21.9426),
    ]
    min_dist = float("inf")
    closest_city = f"Coordinates ({lat:.2f}, {lon:.2f})"
    for name, clat, clon in GLOBAL_REFERENCE_POINTS:
        dist = haversine_distance_km(lat, lon, clat, clon)
        if dist < min_dist:
            min_dist = dist
            if dist < 50.0:
                closest_city = f"{name}"
            else:
                closest_city = f"Region near {name} ({int(dist)} km)"
    return closest_city
