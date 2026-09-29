# TerraGuard AI - Architecture Decision Records (ADR)

## ADR-001: Monorepo Architecture with Python FastAPI Backend & Next.js Frontend
- **Context**: TerraGuard AI requires real-time data ingestion, geospatial analysis, machine learning inference, interactive 3D map visualizations, and WebSocket communications.
- **Decision**: Adopt a clean monorepo architecture:
  - `apps/web`: Next.js (App Router), React, TypeScript, Tailwind CSS, MapLibre GL, Recharts.
  - `apps/api`: Python FastAPI server exposing OpenAPI REST & WebSocket endpoints.
  - `services/ingestion`: Modular provider adapters with circuit breakers, exponential backoff, rate limiting, and dev/mock fallbacks.
  - `packages/shared` & `packages/geo`: Core domain models, GeoJSON schemas, coordinate & spatial indexing utilities.
- **Rationale**: Python provides ecosystem dominance for ML (scikit-learn, XGBoost, SHAP) and geospatial tooling (GeoPandas, rasterio, Shapely). Next.js & MapLibre GL deliver high-performance GPU-accelerated web maps.

## ADR-002: Strict Semantic Separation of Disaster Information Types
- **Context**: Misrepresenting AI risk models as deterministic predictions or conflating official emergency alerts with raw observations compromises scientific integrity and public safety.
- **Decision**: All data in TerraGuard AI strictly belongs to one of four immutable types:
  1. `OBSERVED`: Raw sensor/satellite/seismic station measurements.
  2. `FORECAST`: Numerical weather prediction outputs (ECMWF, GFS).
  3. `AI_RISK_ESTIMATE`: Probabilistic hazard outputs calculated by TerraGuard ML models (always exposing probability, confidence, severity, forecast window, data quality, data freshness, model version).
  4. `OFFICIAL_WARNING`: Government/National Meteorological & Emergency Agency CAP alerts (WMO/GDACS).
- **Rationale**: Ensures public transparency, adherence to emergency management guidelines, and strict scientific rigor (especially avoiding deterministic earthquake prediction claims).

## ADR-003: Modular Provider Adapter Framework with Graceful Fallbacks
- **Context**: External feeds (USGS, GDACS, NASA GPM, GloFAS) can experience downtime, rate limits, or require authentication.
- **Decision**: All external providers inherit from an abstract `BaseProviderAdapter` interface implementing retry decorators, backoff, health metrics (`last_success_timestamp`, `failure_count`, `latency_ms`), structured caching, and dev/mock data providers.
- **Rationale**: Prevents hard coupling to any single vendor, guarantees zero platform downtime when external APIs fail, and allows full offline testing without API credentials.
