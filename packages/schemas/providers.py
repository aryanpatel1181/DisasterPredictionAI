from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from packages.shared.constants import ProviderStatus

class ProviderHealthStatus(BaseModel):
    provider_name: str
    status: ProviderStatus
    last_success_timestamp: Optional[datetime] = None
    failure_count: int = 0
    latency_ms: float = 0.0
    records_ingested: int = 0
    error_message: Optional[str] = None
    is_mock_fallback: bool = False
