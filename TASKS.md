# TerraGuard AI - Tasks Checklist

## TODO
- [ ] Add bathymetric wave propagation grid for tsunami arrival times (Milestone 3)
- [ ] Expand country-specific Doppler radar plugin network for severe weather (Milestone 3)
- [ ] Build cyclone track & intensity ML forecast pipeline (Milestone 3)

## IN PROGRESS
- None.

## DONE
- [x] Initialized monorepo architecture (`apps/web`, `apps/api`, `services/*`, `packages/*`, `ml/*`, `infrastructure/`, `docs/`, `tests/`)
- [x] Implemented Normalized Hazard Model with strict separation of `OBSERVED`, `FORECAST`, `AI_RISK_ESTIMATE`, and `OFFICIAL_WARNING`
- [x] Implemented USGS Earthquake, GDACS Multi-Hazard, WMO CAP Alert, NASA GPM IMERG, and GloFAS adapters with retries, exponential backoff, health tracking, and mock/dev fallbacks
- [x] Implemented FastAPI REST API versioned endpoints & WebSocket event stream (`/ws/v1/events`)
- [x] Developed Flood ML predictive engine with 18-feature hydro-meteorological vector, XGBoost/LightGBM comparison, Platt probability calibration, and SHAP explainability
- [x] Implemented Live Continuous AI Disaster Prediction Engine with explicit multi-horizon forecast windows (`6h`, `12h`, `24h`, `72h`) across Flood, Severe Weather, Cyclone, Earthquake, and Tsunami
- [x] Integrated OpenStreetMap Nominatim universal geocoding allowing search and prediction for ALL cities globally (e.g. Ahmedabad, Chicago, Tokyo, London, Mumbai, etc.)
- [x] Built Next.js 14 Command Center UI with interactive global map layer toggles, live event feed, detail modal, location risk lookup, source health panel, and historical replay bar
- [x] Written comprehensive documentation index (`ARCHITECTURE.md`, `DATA_SOURCES.md`, `ML.md`, `API.md`, `DEPLOYMENT.md`, `SECURITY.md`, `LIMITATIONS.md`, `SCIENTIFIC_INTEGRITY.md`)
- [x] Automated test suite executed and 100% passing (14/14 tests)

## BLOCKED
- None.
