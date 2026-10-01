# TerraGuard AI - System Architecture

## Architecture Diagram
```
                     +-----------------------------------+
                     |      External Data Sources        |
                     | USGS | GDACS | WMO CAP | NASA GPM |
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |    services/ingestion (Adapters)  |
                     | Retries | Backoff | Cache | Fallback|
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |  PostgreSQL / PostGIS & Redis     |
                     | Raw Telemetry & Spatial Indexes  |
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |     services/feature-engine       |
                     | Spatial Joins & Rolling Aggregates|
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |   services/risk_engine & ML       |
                     | Models | Calibration | SHAP Engine|
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |        apps/api (FastAPI)         |
                     | REST endpoints & WebSockets Server|
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |        apps/web (Next.js 14)      |
                     | MapLibre GL Command Center UI     |
                     +-----------------------------------+
```

## Normalized Hazard Representation
Every hazard in TerraGuard AI conforms to a normalized domain model:

- `event_id`: Unique identifier (UUIDv4)
- `hazard_type`: Enumeration (`flood`, `earthquake`, `tsunami`, `severe_weather`, `cyclone`)
- `status`: `OBSERVED` | `FORECAST` | `AI_RISK_ESTIMATE` | `OFFICIAL_WARNING`
- `latitude`, `longitude`, `geometry`: GeoJSON spatial representation
- `country`, `admin_region`, `nearest_populated_place`: Reverse-geocoded spatial attributes
- `detected_at`, `forecast_start`, `forecast_end`: ISO 8601 UTC timestamps
- `severity`: Standardized enum (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`)
- `risk_probability`: Float `[0.0, 1.0]` (separate from confidence)
- `confidence`: Float `[0.0, 1.0]` (degrades on missing/stale telemetry)
- `model_version`: Exact version string from model registry
- `data_freshness_seconds`: Age of newest input feature in seconds
- `sources`: Array of provider metadata & provenance references
- `feature_values`: Key-value pairs of raw & transformed model inputs
- `feature_contributions`: Structured SHAP/contribution breakdown
- `explanation`: Deterministic human-readable explanation
- `official_warnings`: Array of linked CAP/government alert objects
- `population_exposure`: Estimated population in affected radius
