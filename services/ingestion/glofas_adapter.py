from datetime import datetime, timezone
from typing import Any, Dict, List
from services.ingestion.base_adapter import BaseProviderAdapter
from packages.shared.constants import ProviderStatus
from packages.shared.logging import get_logger

logger = get_logger("glofas_adapter")

class GloFASAdapter(BaseProviderAdapter):
    def __init__(self):
        super().__init__(
            provider_name="Copernicus_GloFAS",
            base_url="https://www.globalfloods.eu/",
            timeout_seconds=10.0,
            max_retries=3,
        )

    async def fetch_latest(self) -> List[Dict[str, Any]]:
        self.health.is_mock_fallback = True
        self.health.status = ProviderStatus.DEV_MOCK
        return self.get_mock_data()

    def get_mock_data(self) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        return [
            {
                "river_basin": "Mekong River",
                "station_name": "Pakse Hydrostation",
                "latitude": 15.12,
                "longitude": 105.78,
                "discharge_m3s": 24500.0,
                "discharge_percentile": 97.5,
                "soil_wetness_index": 0.88,
                "timestamp": now,
            }
        ]
