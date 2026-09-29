from typing import Dict, Any, List

def compute_flood_feature_vector(
    precip_30m: float,
    precip_1h: float,
    precip_3h: float,
    precip_6h: float,
    precip_12h: float,
    precip_24h: float,
    precip_72h: float,
    forecast_precip_24h: float,
    river_discharge_m3s: float,
    river_discharge_percentile: float,
    soil_wetness_index: float,
    antecedent_precipitation_index: float,
    elevation_m: float,
    terrain_slope_deg: float,
    distance_to_river_km: float,
    historical_flood_freq_per_decade: float,
    land_cover_impervious_ratio: float,
    population_density_km2: float,
) -> Dict[str, float]:
    """Constructs the canonical 18-feature vector for flood risk prediction."""
    return {
        "precip_30m": float(precip_30m),
        "precip_1h": float(precip_1h),
        "precip_3h": float(precip_3h),
        "precip_6h": float(precip_6h),
        "precip_12h": float(precip_12h),
        "precip_24h": float(precip_24h),
        "precip_72h": float(precip_72h),
        "forecast_precip_24h": float(forecast_precip_24h),
        "river_discharge_m3s": float(river_discharge_m3s),
        "river_discharge_percentile": float(river_discharge_percentile),
        "soil_wetness_index": float(soil_wetness_index),
        "antecedent_precipitation_index": float(antecedent_precipitation_index),
        "elevation_m": float(elevation_m),
        "terrain_slope_deg": float(terrain_slope_deg),
        "distance_to_river_km": float(distance_to_river_km),
        "historical_flood_freq_per_decade": float(historical_flood_freq_per_decade),
        "land_cover_impervious_ratio": float(land_cover_impervious_ratio),
        "population_density_km2": float(population_density_km2),
    }

FEATURE_NAMES: List[str] = list(compute_flood_feature_vector(
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
).keys())
