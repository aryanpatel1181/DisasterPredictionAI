import pytest
from services.ingestion.gdacs_adapter import GDACSAdapter
from packages.shared.constants import HazardStatus

@pytest.mark.asyncio
async def test_gdacs_adapter_fetch_or_fallback():
    adapter = GDACSAdapter()
    events = await adapter.fetch_latest()
    
    assert len(events) > 0
    first = events[0]
    assert first.status == HazardStatus.OFFICIAL_WARNING
    assert first.official_warnings is not None
