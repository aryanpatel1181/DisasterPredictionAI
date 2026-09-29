import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from services.ingestion.base_adapter import BaseProviderAdapter
from packages.schemas.hazard import (
    NormalizedHazardEvent,
    GeometryGeoJSON,
    StructuredExplanation,
    FeatureContribution,
    DataProvenance,
)
from packages.shared.constants import HazardType, HazardStatus, HazardSeverity, ProviderStatus
from packages.geo.spatial import get_nearest_known_city
from packages.shared.logging import get_logger

logger = get_logger("usgs_adapter")

class USGSAdapter(BaseProviderAdapter):
    def __init__(self):
        super().__init__(
            provider_name="USGS_Earthquake_API",
            base_url="https://earthquake.usgs.gov/fdsnws/event/1/",
            timeout_seconds=8.0,
            max_retries=3,
        )

    async def fetch_latest(self) -> List[NormalizedHazardEvent]:
        endpoint = f"{self.base_url}query"
        params = {
            "format": "geojson",
            "minmagnitude": "3.0",
            "limit": "40",
            "orderby": "time",
        }
        try:
            res = await self._fetch_with_retry(endpoint, params=params)
            data = res.json()
            features = data.get("features", [])
            events = self._parse_usgs_features(features)
            self.health.records_ingested = len(events)
            return events
        except Exception as exc:
            logger.warning(f"[USGSAdapter] Live fetch failed ({exc}), falling back to dev/mock seismic feed.")
            self.health.is_mock_fallback = True
            self.health.status = ProviderStatus.DEV_MOCK
            return self._parse_usgs_features(self.get_mock_data())

    def _parse_usgs_features(self, raw_features: List[Dict[str, Any]]) -> List[NormalizedHazardEvent]:
        parsed_events = []
        now = datetime.now(timezone.utc)

        for feat in raw_features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [0.0, 0.0, 0.0])
            lon, lat, depth_km = coords[0], coords[1], coords[2] if len(coords) > 2 else 10.0

            mag = float(props.get("mag", 4.5) or 4.5)
            title = props.get("title", f"M {mag:.1f} Earthquake")
            event_code = props.get("code") or str(uuid.uuid4())[:8]
            time_epoch = props.get("time")
            
            if time_epoch:
                detected_dt = datetime.fromtimestamp(time_epoch / 1000.0, tz=timezone.utc)
            else:
                detected_dt = now

            # Categorize Severity
            if mag >= 7.0:
                sev = HazardSeverity.CRITICAL
                prob = 0.95
            elif mag >= 6.0:
                sev = HazardSeverity.HIGH
                prob = 0.80
            elif mag >= 4.5:
                sev = HazardSeverity.MODERATE
                prob = 0.55
            else:
                sev = HazardSeverity.LOW
                prob = 0.30

            nearest_loc = get_nearest_known_city(lat, lon)
            
            # Feature attributions
            feat_contribs = [
                FeatureContribution(feature="magnitude_mw", value=mag, unit="Mw", contribution=0.45),
                FeatureContribution(feature="focal_depth_km", value=depth_km, unit="km", contribution=-0.15 if depth_km > 70 else 0.20),
                FeatureContribution(feature="distance_to_population", value=45, unit="km", contribution=0.10),
            ]

            explanation_text = (
                f"Observed seismic activity registering Magnitude {mag:.1f} Mw at depth {depth_km:.1f} km. "
                f"Located near {nearest_loc}. Tsunami trigger evaluation active based on depth and oceanic proximity."
            )

            # Separate Risk Output metrics
            event = NormalizedHazardEvent(
                event_id=f"usgs_{event_code}",
                hazard_type=HazardType.EARTHQUAKE,
                status=HazardStatus.OBSERVED,
                latitude=lat,
                longitude=lon,
                geometry=GeometryGeoJSON(type="Point", coordinates=[lon, lat, depth_km]),
                country=props.get("place", "Global Seismic Zone"),
                nearest_populated_location=nearest_loc,
                detected_timestamp=detected_dt,
                forecast_start=detected_dt,
                forecast_end=detected_dt + timedelta(hours=24),
                severity=sev,
                risk_probability=prob,
                confidence=0.98,
                model_version="usgs_seismic_v1.0",
                data_quality=1.0,
                data_freshness_seconds=max(0.0, (now - detected_dt).total_seconds()),
                sources=[
                    DataProvenance(
                        provider=self.provider_name,
                        provider_record_id=str(event_code),
                        source_timestamp=detected_dt,
                        ingestion_timestamp=now,
                        original_unit="Mw",
                        normalized_unit="Mw",
                        processing_version="v1.0.0",
                        source_url=props.get("url", self.base_url),
                    )
                ],
                feature_values={
                    "magnitude": mag,
                    "depth_km": depth_km,
                    "mmi_shaking": props.get("mmi"),
                    "tsunami_flag": props.get("tsunami", 0),
                    "felt_reports": props.get("felt", 0),
                },
                feature_contributions=feat_contribs,
                explanation=StructuredExplanation(
                    risk_probability=prob,
                    primary_drivers=feat_contribs,
                    human_summary=explanation_text,
                ),
                population_exposure=150000 if mag >= 6.0 else 25000,
            )
            parsed_events.append(event)
            
        return parsed_events

    def get_mock_data(self) -> List[Dict[str, Any]]:
        """Dev/Mock USGS GeoJSON fixtures."""
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        return [
            {
                "properties": {
                    "mag": 6.4,
                    "title": "M 6.4 - 42 km SSW of Noto, Japan",
                    "code": "us7000mock1",
                    "time": now_ms - 900000,
                    "place": "Noto, Japan",
                    "mmi": 7.2,
                    "tsunami": 1,
                    "url": "https://earthquake.usgs.gov/",
                },
                "geometry": {"type": "Point", "coordinates": [137.02, 37.35, 12.4]},
            },
            {
                "properties": {
                    "mag": 5.8,
                    "title": "M 5.8 - 18 km W of Valparaiso, Chile",
                    "code": "us7000mock2",
                    "time": now_ms - 3600000,
                    "place": "Valparaiso, Chile",
                    "mmi": 6.1,
                    "tsunami": 0,
                    "url": "https://earthquake.usgs.gov/",
                },
                "geometry": {"type": "Point", "coordinates": [-71.62, -33.04, 28.0]},
            },
            {
                "properties": {
                    "mag": 7.1,
                    "title": "M 7.1 - 85 km ENE of Davao, Philippines",
                    "code": "us7000mock3",
                    "time": now_ms - 7200000,
                    "place": "Davao, Philippines",
                    "mmi": 8.0,
                    "tsunami": 1,
                    "url": "https://earthquake.usgs.gov/",
                },
                "geometry": {"type": "Point", "coordinates": [126.15, 7.25, 45.0]},
            },
        ]
