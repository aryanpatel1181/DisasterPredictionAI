from datetime import datetime, timezone
import pytest
from packages.schemas.hazard import (
    NormalizedHazardEvent,
    GeometryGeoJSON,
    StructuredExplanation,
    FeatureContribution,
    DataProvenance,
)
from packages.shared.constants import HazardType, HazardStatus, HazardSeverity

def test_normalized_hazard_event_creation():
    now = datetime.now(timezone.utc)
    event = NormalizedHazardEvent(
        event_id="test_eq_001",
        hazard_type=HazardType.EARTHQUAKE,
        status=HazardStatus.OBSERVED,
        latitude=37.7749,
        longitude=-122.4194,
        geometry=GeometryGeoJSON(type="Point", coordinates=[-122.4194, 37.7749]),
        country="United States",
        nearest_populated_location="San Francisco, USA",
        detected_timestamp=now,
        severity=HazardSeverity.HIGH,
        risk_probability=0.78,
        confidence=0.95,
        model_version="usgs_seismic_v1.0",
        data_quality=1.0,
        explanation=StructuredExplanation(
            risk_probability=0.78,
            primary_drivers=[
                FeatureContribution(feature="magnitude_mw", value=6.2, unit="Mw", contribution=0.45)
            ],
            human_summary="M 6.2 seismic observation.",
        ),
    )

    assert event.event_id == "test_eq_001"
    assert event.hazard_type == HazardType.EARTHQUAKE
    assert event.status == HazardStatus.OBSERVED
    # Ensure risk_probability and confidence are separate
    assert event.risk_probability != event.confidence
    assert event.risk_probability == 0.78
    assert event.confidence == 0.95
    assert event.geometry.coordinates == [-122.4194, 37.7749]
