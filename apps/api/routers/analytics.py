
"""
Analytics router for website footfall tracking.

Privacy-first approach:
- No IP addresses stored or returned
- Only coarse country information derived from request metadata
- No personally identifiable information (PII) collected
- Events are aggregated for statistical purposes only
"""

import threading
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

MAX_EVENTS = 100_000
_events: deque = deque(maxlen=MAX_EVENTS)
_lock = threading.Lock()


@dataclass
class AnalyticsEvent:
    event_id: str
    path: str
    referrer: str
    session_id: str
    user_agent: str
    country: str
    referrer_category: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class AnalyticsEventRequest(BaseModel):
    path: str = Field(..., description="Page path visited")
    referrer: str = Field("", description="Referrer URL")
    session_id: str = Field(..., description="Client session identifier")
    user_agent: str = Field("", description="Browser user agent string")
    country: str = Field("", description="Coarse country code/name")
    referrer_category: str = Field("", description="Pre-categorized referrer (optional)")


def _categorize_referrer(referrer: str) -> str:
    """Categorize a referrer URL into a high-level category."""
    if not referrer:
        return "direct"

    ref_lower = referrer.lower()

    search_engines = ["google", "bing", "duckduckgo", "yahoo", "baidu"]
    if any(se in ref_lower for se in search_engines):
        return "search"

    social_sites = ["facebook", "twitter", "x.com", "linkedin", "instagram", "reddit"]
    if any(s in ref_lower for s in social_sites):
        return "social"

    dev_sites = ["github", "stackoverflow", "dev.to"]
    if any(d in ref_lower for d in dev_sites):
        return "developer"

    return "referral"


def _record_event(event: AnalyticsEvent) -> None:
    """Thread-safe event recording."""
    with _lock:
        _events.append(event)


def _query_events(since: Optional[datetime] = None) -> list[AnalyticsEvent]:
    """Thread-safe event querying with optional time filter."""
    with _lock:
        if since is None:
            return list(_events)
        return [e for e in _events if e.timestamp >= since]


@router.post("/events", status_code=202)
async def record_event(request: AnalyticsEventRequest) -> dict:
    """Record a single analytics event."""
    event_id = str(uuid.uuid4())
    category = request.referrer_category or _categorize_referrer(request.referrer)

    event = AnalyticsEvent(
        event_id=event_id,
        path=request.path,
        referrer=request.referrer,
        session_id=request.session_id,
        user_agent=request.user_agent,
        country=request.country,
        referrer_category=category,
    )

    _record_event(event)
    return {"status": "recorded", "event_id": event_id}


@router.get("/stats/summary")
async def stats_summary(days: int = Query(7, ge=1, le=365)) -> dict:
    """Overall traffic summary for the given window."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    events = _query_events(since)

    if not events:
        return {
            "window_days": days,
            "total_events": 0,
            "unique_sessions": 0,
            "avg_events_per_session": 0.0,
            "by_path": [],
            "by_referrer_category": [],
            "by_country": [],
            "daily": [],
            "top_paths": [],
        }

    total_events = len(events)
    unique_sessions = len({e.session_id for e in events})
    avg_events_per_session = round(total_events / unique_sessions, 2) if unique_sessions else 0.0

    path_counts: dict[str, dict] = {}
    for e in events:
        if e.path not in path_counts:
            path_counts[e.path] = {"views": 0, "sessions": set()}
        path_counts[e.path]["views"] += 1
        path_counts[e.path]["sessions"].add(e.session_id)

    by_path = [
        {"path": p, "views": d["views"], "unique_sessions": len(d["sessions"])}
        for p, d in sorted(path_counts.items(), key=lambda x: x[1]["views"], reverse=True)
    ]

    referrer_cat_counts: dict[str, int] = {}
    for e in events:
        referrer_cat_counts[e.referrer_category] = referrer_cat_counts.get(e.referrer_category, 0) + 1
    by_referrer_category = [
        {"category": cat, "count": cnt}
        for cat, cnt in sorted(referrer_cat_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    country_counts: dict[str, int] = {}
    for e in events:
        country = e.country or "Unknown"
        country_counts[country] = country_counts.get(country, 0) + 1
    by_country = [
        {"country": c, "count": cnt}
        for c, cnt in sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    daily_counts: dict[str, dict] = {}
    for e in events:
        date_str = e.timestamp.date().isoformat()
        if date_str not in daily_counts:
            daily_counts[date_str] = {"views": 0, "sessions": set()}
        daily_counts[date_str]["views"] += 1
        daily_counts[date_str]["sessions"].add(e.session_id)

    daily = [
        {"date": d, "views": v["views"], "unique_sessions": len(v["sessions"])}
        for d, v in sorted(daily_counts.items())
    ]

    top_paths = [item["path"] for item in by_path[:10]]

    return {
        "window_days": days,
        "total_events": total_events,
        "unique_sessions": unique_sessions,
        "avg_events_per_session": avg_events_per_session,
        "by_path": by_path,
        "by_referrer_category": by_referrer_category,
        "by_country": by_country,
        "daily": daily,
        "top_paths": top_paths,
    }


@router.get("/stats/timeseries")
async def stats_timeseries(days: int = Query(7, ge=1, le=365)) -> dict:
    """Hourly breakdown of views by hour of day."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    events = _query_events(since)

    hour_counts: dict[int, int] = {}
    for e in events:
        hour = e.timestamp.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1

    hours = [{"hour": h, "views": hour_counts.get(h, 0)} for h in range(24)]

    return {"hours": hours}


@router.get("/referrers")
async def top_referrers(limit: int = Query(20, ge=1, le=100)) -> dict:
    """Top referrers by count."""
    events = _query_events()

    referrer_counts: dict[str, dict] = {}
    for e in events:
        if not e.referrer:
            continue
        if e.referrer not in referrer_counts:
            referrer_counts[e.referrer] = {"count": 0, "category": e.referrer_category}
        referrer_counts[e.referrer]["count"] += 1

    referrers = [
        {"referrer": r, "count": d["count"], "category": d["category"]}
        for r, d in sorted(referrer_counts.items(), key=lambda x: x[1]["count"], reverse=True)
    ][:limit]

    return {"referrers": referrers}

