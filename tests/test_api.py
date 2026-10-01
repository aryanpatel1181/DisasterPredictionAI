import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from packages.shared.config import settings

@pytest.fixture
def transport():
    return ASGITransport(app=app)

@pytest.mark.asyncio
async def test_api_health_endpoint(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "ai_chat" in data
        assert "mode" in data["ai_chat"]

@pytest.mark.asyncio
async def test_ai_chat_health_status_matches_current_openrouter_config(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ai_chat"]["provider"] == "OpenRouter"
        assert data["ai_chat"]["enabled"] == bool(settings.OPENROUTER_API_KEY)
        assert data["ai_chat"]["mode"] == ("live" if settings.OPENROUTER_API_KEY else "fallback")

@pytest.mark.asyncio
async def test_api_events_endpoint(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) > 0

@pytest.mark.asyncio
async def test_api_location_risk_endpoint(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/location-risk?lat=35.6762&lon=139.6503")
        assert response.status_code == 200
        data = response.json()
        assert "hazard_risks" in data
        assert "earthquake" in data["hazard_risks"]
        assert "flood" in data["hazard_risks"]

@pytest.mark.asyncio
async def test_api_sources_status_endpoint(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/sources/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

@pytest.mark.asyncio
async def test_api_models_endpoint(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/models")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
