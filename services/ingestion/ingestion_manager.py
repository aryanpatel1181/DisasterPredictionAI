import asyncio
from typing import Dict, List
from services.ingestion.usgs_adapter import USGSAdapter
from services.ingestion.gdacs_adapter import GDACSAdapter
from services.ingestion.wmo_cap_adapter import WMOCAPAdapter
from services.ingestion.nasa_gpm_adapter import NASAGPMAdapter
from services.ingestion.glofas_adapter import GloFASAdapter
from packages.schemas.hazard import NormalizedHazardEvent
from packages.schemas.providers import ProviderHealthStatus
from packages.shared.logging import get_logger

logger = get_logger("ingestion_manager")

class IngestionManager:
    def __init__(self):
        self.usgs_adapter = USGSAdapter()
        self.gdacs_adapter = GDACSAdapter()
        self.wmo_cap_adapter = WMOCAPAdapter()
        self.nasa_gpm_adapter = NASAGPMAdapter()
        self.glofas_adapter = GloFASAdapter()

    async def fetch_all_events(self) -> List[NormalizedHazardEvent]:
        logger.info("Executing concurrent provider ingestion pass...")
        tasks = [
            self.usgs_adapter.fetch_latest(),
            self.gdacs_adapter.fetch_latest(),
            self.wmo_cap_adapter.fetch_latest(),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_events: List[NormalizedHazardEvent] = []
        adapters = [self.usgs_adapter, self.gdacs_adapter, self.wmo_cap_adapter]
        for adapter, res in zip(adapters, results):
            if isinstance(res, list):
                if adapter.health.is_mock_fallback:
                    for event in res:
                        for source in event.sources:
                            if not source.provider.startswith("DEMO_"):
                                source.provider = "DEMO_" + source.provider
                all_events.extend(res)
            elif isinstance(res, Exception):
                logger.error(f"Provider ingestion error: {res}")
                
        logger.info(f"Ingestion pass completed. Total normalized events collected: {len(all_events)}")
        return all_events

    def get_sources_status(self) -> List[ProviderHealthStatus]:
        return [
            self.usgs_adapter.health,
            self.gdacs_adapter.health,
            self.wmo_cap_adapter.health,
            self.nasa_gpm_adapter.health,
            self.glofas_adapter.health,
        ]

ingestion_manager = IngestionManager()
