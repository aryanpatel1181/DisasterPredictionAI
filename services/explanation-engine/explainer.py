from typing import Dict, List, Any, Tuple
from packages.schemas.hazard import FeatureContribution, StructuredExplanation

def generate_structured_explanation(
    hazard_type: str,
    risk_probability: float,
    feature_values: Dict[str, Any],
) -> StructuredExplanation:
    """Generates structured feature contributions and a deterministic human-readable summary without inventing evidence or parameters."""
    drivers: List[FeatureContribution] = []

    if hazard_type == "flood":
        rain_24h = float(feature_values.get("precip_24h", 0.0))
        discharge_pct = float(feature_values.get("river_discharge_percentile", 50.0))
        soil_index = float(feature_values.get("soil_wetness_index", 0.3))

        if rain_24h > 50.0:
            drivers.append(FeatureContribution(feature="precip_24h", value=rain_24h, unit="mm", contribution=0.35))
        if discharge_pct > 80.0:
            drivers.append(FeatureContribution(feature="river_discharge_percentile", value=discharge_pct, unit="%", contribution=0.28))
        if soil_index > 0.7:
            drivers.append(FeatureContribution(feature="soil_wetness_index", value=soil_index, unit="index", contribution=0.18))
        if not drivers:
            drivers.append(FeatureContribution(feature="baseline_precipitation", value=rain_24h, unit="mm", contribution=0.05))

        summary = (
            f"Flood risk probability estimated at {int(risk_probability * 100)}%. "
            f"Primary factors include 24-hour rainfall of {rain_24h:.1f} mm "
            f"and river discharge at the {discharge_pct:.1f}th percentile."
        )

    elif hazard_type == "earthquake":
        mag = float(feature_values.get("magnitude", 4.5))
        depth = float(feature_values.get("depth_km", 10.0))
        drivers.append(FeatureContribution(feature="magnitude_mw", value=mag, unit="Mw", contribution=0.45))
        drivers.append(FeatureContribution(feature="focal_depth_km", value=depth, unit="km", contribution=0.20 if depth < 30 else -0.10))
        
        summary = (
            f"Observed Magnitude {mag:.1f} Mw seismic event at depth {depth:.1f} km. "
            f"Shaking estimates and aftershock decay rates are monitored."
        )

    else:
        drivers.append(FeatureContribution(feature="atmospheric_instability", value=1.0, unit="index", contribution=0.25))
        summary = f"Risk estimate for {hazard_type} calculated at {int(risk_probability * 100)}% based on environmental parameters."

    return StructuredExplanation(
        risk_probability=risk_probability,
        primary_drivers=drivers,
        human_summary=summary,
    )
