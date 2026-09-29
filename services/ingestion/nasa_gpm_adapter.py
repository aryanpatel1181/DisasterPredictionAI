from datetime import datetime, timezone
from typing import Any, Dict, List
from services.ingestion.base_adapter import BaseProviderAdapter
from packages.shared.constants import ProviderStatus
from packages.shared.logging import get_logger

logger = get_logger("nasa_gpm_adapter")

class NASAGPMAdapter(BaseProviderAdapter):
    def __init__(self):
        super().__init__(
            provider_name="NASA_GPM_IMERG",
            base_url="https://gpm.nasa.gov/data/imerg",
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
                "latitude": 14.5,
                "longitude": 121.0,
                "precipitation_rate_mm_hr": 28.5,
                "precip_acc_3h_mm": 65.0,
                "precip_acc_24h_mm": 195.0,
                "timestamp": now,
            },
            {
                "latitude": -3.7,
                "longitude": -38.5,
                "precipitation_rate_mm_hr": 14.2,
                "precip_acc_3h_mm": 35.0,
                "precip_acc_24h_mm": 110.0,
                "timestamp": now,
            },
        ]
