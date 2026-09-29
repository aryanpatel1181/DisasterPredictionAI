import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from apps.api.routers.analytics import router, _categorize_referrer


def create_test_app() -> FastAPI:
    app = FastAPI()
    app.include_router(router)
    return app


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_test_app())


def test_post_events_returns_202_and_event_id(client: TestClient):
    response = client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/",
            "referrer": "https://google.com",
            "session_id": "test-session-123",
            "user_agent": "Mozilla/5.0 Test Browser",
            "country": "United States",
        },
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "recorded"
    assert "event_id" in data
    # Verify it"s a valid UUID
    import uuid
    uuid.UUID(data["event_id"])


def test_get_stats_summary_returns_expected_keys(client: TestClient):
    # First add some events
    client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/",
            "referrer": "https://google.com",
            "session_id": "test-session-1",
            "user_agent": "Mozilla/5.0",
            "country": "US",
        },
    )
    client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/location",
            "referrer": "https://facebook.com",
            "session_id": "test-session-2",
            "user_agent": "Mozilla/5.0",
            "country": "US",
        },
    )

    response = client.get("/api/v1/analytics/stats/summary?days=7")
    assert response.status_code == 200
    data = response.json()
    expected_keys = {
        "window_days",
        "total_events",
        "unique_sessions",
        "avg_events_per_session",
        "by_path",
        "by_referrer_category",
        "by_country",
        "daily",
        "top_paths",
    }
    assert set(data.keys()) == expected_keys
    assert data["window_days"] == 7
    assert data["total_events"] >= 2
    assert data["unique_sessions"] >= 2
    assert isinstance(data["avg_events_per_session"], float)
    assert isinstance(data["by_path"], list)
    assert isinstance(data["by_referrer_category"], list)
    assert isinstance(data["by_country"], list)
    assert isinstance(data["daily"], list)
    assert isinstance(data["top_paths"], list)


def test_get_stats_timeseries_returns_hours_key(client: TestClient):
    client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/",
            "referrer": "",
            "session_id": "test-session-3",
            "user_agent": "Mozilla/5.0",
            "country": "US",
        },
    )

    response = client.get("/api/v1/analytics/stats/timeseries?days=7")
    assert response.status_code == 200
    data = response.json()
    assert "hours" in data
    assert isinstance(data["hours"], list)
    assert len(data["hours"]) == 24
    for hour_data in data["hours"]:
        assert "hour" in hour_data
        assert "views" in hour_data
        assert 0 <= hour_data["hour"] <= 23


def test_get_referrers_returns_referrers_key(client: TestClient):
    client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/",
            "referrer": "https://google.com/search?q=test",
            "session_id": "test-session-4",
            "user_agent": "Mozilla/5.0",
            "country": "US",
        },
    )
    client.post(
        "/api/v1/analytics/events",
        json={
            "path": "/about",
            "referrer": "https://google.com/search?q=about",
            "session_id": "test-session-5",
            "user_agent": "Mozilla/5.0",
            "country": "US",
        },
    )

    response = client.get("/api/v1/analytics/referrers?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert "referrers" in data
    assert isinstance(data["referrers"], list)
    assert len(data["referrers"]) >= 1
    for ref in data["referrers"]:
        assert "referrer" in ref
        assert "count" in ref
        assert "category" in ref


def test_referrer_categorization():
    assert _categorize_referrer("") == "direct"
    assert _categorize_referrer("https://google.com") == "search"
    assert _categorize_referrer("https://www.google.com/search") == "search"
    assert _categorize_referrer("https://bing.com") == "search"
    assert _categorize_referrer("https://duckduckgo.com") == "search"
    assert _categorize_referrer("https://facebook.com") == "social"
    assert _categorize_referrer("https://twitter.com") == "social"
    assert _categorize_referrer("https://x.com") == "social"
    assert _categorize_referrer("https://linkedin.com") == "social"
    assert _categorize_referrer("https://instagram.com") == "social"
    assert _categorize_referrer("https://reddit.com") == "social"
    assert _categorize_referrer("https://github.com") == "developer"
    assert _categorize_referrer("https://stackoverflow.com") == "developer"
    assert _categorize_referrer("https://dev.to") == "developer"
    assert _categorize_referrer("https://example.com/blog") == "referral"

