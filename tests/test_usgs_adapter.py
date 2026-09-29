import pytest
from services.ingestion.usgs_adapter import USGSAdapter
from packages.shared.constants import HazardType

@pytest.mark.asyncio
async def test_usgs_adapter_fetch_or_fallback():
    adapter = USGSAdapter()
    events = await adapter.fetch_latest()
    
    assert len(events) > 0
    first = events[0]
    assert first.hazard_type == HazardType.EARTHQUAKE
    assert first.latitude is not None
    assert first.longitude is not None
    assert first.risk_probability > 0.0
    assert first.confidence > 0.0
