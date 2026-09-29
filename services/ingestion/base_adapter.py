import abc
import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from packages.schemas.providers import ProviderHealthStatus
from packages.shared.constants import ProviderStatus
from packages.shared.logging import get_logger

logger = get_logger("ingestion_adapter")

class BaseProviderAdapter(abc.ABC):
    def __init__(
        self,
        provider_name: str,
        base_url: str,
        timeout_seconds: float = 10.0,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
    ):
        self.provider_name = provider_name
        self.base_url = base_url
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        
        self.health = ProviderHealthStatus(
            provider_name=provider_name,
            status=ProviderStatus.HEALTHY,
            last_success_timestamp=None,
            failure_count=0,
            latency_ms=0.0,
            records_ingested=0,
            error_message=None,
            is_mock_fallback=False,
        )

    async def _fetch_with_retry(
        self, url: str, headers: Optional[Dict[str, str]] = None, params: Optional[Dict[str, Any]] = None
    ) -> Any:
        start_time = time.time()
        attempt = 0
        last_exception = None

        while attempt < self.max_retries:
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
                    response = await client.get(url, headers=headers, params=params)
                    response.raise_for_status()
                    
                    elapsed_ms = (time.time() - start_time) * 1000.0
                    self.health.latency_ms = round(elapsed_ms, 2)
                    self.health.last_success_timestamp = datetime.now(timezone.utc)
                    self.health.failure_count = 0
                    self.health.status = ProviderStatus.HEALTHY
                    self.health.error_message = None
                    self.health.is_mock_fallback = False
                    return response
            except Exception as exc:
                attempt += 1
                last_exception = exc
                logger.warning(
                    f"[{self.provider_name}] Ingestion attempt {attempt}/{self.max_retries} failed for {url}: {exc}"
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_factor ** attempt)

        # Retry exhausted - mark degraded/down
        self.health.failure_count += 1
        self.health.error_message = str(last_exception)
        self.health.status = ProviderStatus.DEGRADED if self.health.failure_count < 5 else ProviderStatus.DOWN
        logger.error(f"[{self.provider_name}] All retries failed for {url}. Engaging dev/mock fallback.")
        raise last_exception

    @abc.abstractmethod
    async def fetch_latest(self) -> List[Dict[str, Any]]:
        """Fetch and parse latest telemetry records from the external provider or mock fallback."""
        pass

    @abc.abstractmethod
    def get_mock_data(self) -> List[Dict[str, Any]]:
        """Return realistic dev/mock telemetry records when external API is unreachable or offline."""
        pass
