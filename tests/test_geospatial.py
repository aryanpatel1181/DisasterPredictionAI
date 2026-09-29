from packages.geo.spatial import (
    haversine_distance_km,
    is_point_in_bbox,
    cluster_points,
    get_nearest_known_city,
)

def test_haversine_distance():
    # Tokyo to San Francisco ~8270 km
    dist = haversine_distance_km(35.6762, 139.6503, 37.7749, -122.4194)
    assert 8200 < dist < 8400

def test_bbox_filtering():
    # San Francisco point
    sf_lat, sf_lon = 37.7749, -122.4194
    bbox_usa = [-125.0, 24.0, -66.0, 49.0]
    bbox_asia = [100.0, 10.0, 145.0, 45.0]

    assert is_point_in_bbox(sf_lat, sf_lon, bbox_usa) is True
    assert is_point_in_bbox(sf_lat, sf_lon, bbox_asia) is False

def test_clustering_points():
    features = [
        {"latitude": 35.0, "longitude": 139.0, "risk_probability": 0.8},
        {"latitude": 35.2, "longitude": 139.1, "risk_probability": 0.6},
        {"latitude": 35.1, "longitude": 139.05, "risk_probability": 0.9},
    ]
    clusters = cluster_points(features, grid_size_deg=2.0)
    assert len(clusters) == 1
    assert clusters[0]["is_cluster"] is True
    assert clusters[0]["cluster_count"] == 3
    assert clusters[0]["risk_probability"] == 0.9

def test_nearest_known_city():
    city = get_nearest_known_city(35.67, 139.65)
    assert "Tokyo" in city
