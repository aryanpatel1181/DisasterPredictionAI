import pytest
from services.ingestion.wmo_cap_adapter import WMOCAPAdapter

@pytest.mark.asyncio
async def test_wmo_cap_adapter():
    adapter = WMOCAPAdapter()
    events = await adapter.fetch_latest()
    
    assert len(events) > 0
    assert events[0].official_warnings[0].issuing_authority is not None
