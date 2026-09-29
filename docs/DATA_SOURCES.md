# Data Sources & Adapters - TerraGuard AI

## 1. Adapter Architecture
All data ingestion in TerraGuard AI uses the `BaseProviderAdapter` interface defined in `services/ingestion/base_adapter.py`.

### Adapter Guarantees
- **Exponential Backoff**: Automatic retry on HTTP 429/5xx errors with jitter.
- **Circuit Breaker**: Prevents cascading failures when remote APIs are down.
- **Provider Health Metrics**: Tracking `failure_count`, `last_success_timestamp`, `avg_latency_ms`.
- **Graceful Degradation / Dev Fallbacks**: If external API credentials or endpoints are unreachable, adapter automatically switches to dev/mock generator without breaking downstream pipelines.

## 2. Integrated Providers

| Provider | Data Ingested | Protocol | Update Frequency | Credentials Required |
|---|---|---|---|---|
| **USGS Earthquake API** | Global seismic events, magnitude, depth, MMI | REST / GeoJSON | 1 minute | No |
| **GDACS (Global Disaster Alert & Coordination System)** | Multihazard alerts (floods, earthquakes, tsunamis, cyclones, volcanoes) | RSS / XML / GeoJSON | 5 minutes | No |
| **WMO CAP Alerts** | Official meteorological & emergency alerts | CAP 1.2 XML | 5 minutes | No |
| **NASA GPM / IMERG** | Near-real-time precipitation telemetry | HDF5 / GeoTIFF / REST | 30 minutes | Earthdata Token |
| **Copernicus GloFAS** | Global river discharge & inundation forecasts | GRIB2 / NetCDF / REST | 6 hours | CDS API Key |
| **ECMWF IFS** | Numerical weather prediction parameters (CAPE, shear, pressure, wind) | GRIB2 / REST | 6 hours | ECMWF API Key |
