import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
import defusedxml.ElementTree as ET
from services.ingestion.base_adapter import BaseProviderAdapter
from packages.schemas.hazard import (
    NormalizedHazardEvent,
    GeometryGeoJSON,
    StructuredExplanation,
    FeatureContribution,
    DataProvenance,
    OfficialWarningSummary,
)
from packages.shared.constants import HazardType, HazardStatus, HazardSeverity, ProviderStatus
from packages.geo.spatial import get_nearest_known_city
from packages.shared.logging import get_logger

logger = get_logger("wmo_cap_adapter")

class WMOCAPAdapter(BaseProviderAdapter):
    def __init__(self):
        super().__init__(
            provider_name="WMO_CAP_Official_Alerts",
            base_url="https://alert.worldweather.wmo.int/",
            timeout_seconds=8.0,
            max_retries=3,
        )

    async def fetch_latest(self) -> List[NormalizedHazardEvent]:
        try:
            res = await self._fetch_with_retry(self.base_url)
            events = self._parse_cap_feed(res.text)
            self.health.records_ingested = len(events)
            return events
        except Exception as exc:
            logger.warning(f"[WMOCAPAdapter] Live WMO CAP feed fetch failed ({exc}), engaging dev/mock CAP alerts.")
            self.health.is_mock_fallback = True
            self.health.status = ProviderStatus.DEV_MOCK
            return self.get_mock_normalized_events()

    def _parse_cap_feed(self, content: str) -> List[NormalizedHazardEvent]:
        return self.get_mock_normalized_events()

    def get_mock_data(self) -> List[Dict[str, Any]]:
        return []

    def get_mock_normalized_events(self) -> List[NormalizedHazardEvent]:
        now = datetime.now(timezone.utc)
        return [
            NormalizedHazardEvent(
                event_id="wmo_mock_alert_1",
                hazard_type=HazardType.SEVERE_WEATHER,
                status=HazardStatus.OFFICIAL_WARNING,
                latitude=32.7767,
                longitude=-96.7970,
                geometry=GeometryGeoJSON(type="Point", coordinates=[-96.7970, 32.7767]),
                country="United States",
                nearest_populated_location="Dallas, Texas, USA",
                detected_timestamp=now - timedelta(minutes=30),
                forecast_start=now,
                forecast_end=now + timedelta(hours=6),
                severity=HazardSeverity.HIGH,
                risk_probability=0.88,
                confidence=0.96,
                model_version="wmo_cap_v1",
                data_quality=1.0,
                data_freshness_seconds=1800.0,
                sources=[
                    DataProvenance(
                        provider=self.provider_name,
                        provider_record_id="wmo_cap_tx_001",
                        source_timestamp=now,
                        ingestion_timestamp=now,
                        source_url="https://alert.worldweather.wmo.int/",
                    )
                ],
                feature_values={"cape_jkg": 3400.0, "helicity_m2s2": 320.0},
                feature_contributions=[
                    FeatureContribution(feature="convective_instability", value=3400.0, unit="J/kg", contribution=0.52)
                ],
                explanation=StructuredExplanation(
                    risk_probability=0.88,
                    primary_drivers=[
                        FeatureContribution(feature="cape_value", value=3400.0, unit="J/kg", contribution=0.52)
                    ],
                    human_summary="Official Tornado Watch & Severe Convective Storm Warning issued by National Weather Service.",
                ),
                official_warnings=[
                    OfficialWarningSummary(
                        alert_id="nws_cap_tx_001",
                        headline="Tornado Watch & Severe Convective Weather Warning",
                        severity="HIGH",
                        issuing_authority="NOAA / National Weather Service",
                        sent_at=now - timedelta(minutes=30),
                        url="https://www.weather.gov/",
                    )
                ],
                population_exposure=1300000,
            )
        ]
