# API Documentation - TerraGuard AI

## Base URL
`/api/v1`

## Key REST Endpoints

### 1. Events & Hazards
- `GET /api/v1/events`
  - Query parameters: `hazard_type`, `status`, `min_severity`, `bbox`, `limit`, `offset`
- `GET /api/v1/events/{id}`
  - Returns detailed normalized hazard record including SHAP feature contributions, timeline, and linked official warnings.
- `GET /api/v1/hazards/{hazard_type}`
  - Filter hazards by specific type (`flood`, `earthquake`, `tsunami`, `severe_weather`, `cyclone`).

### 2. Location Risk Lookup
- `GET /api/v1/location-risk`
  - Query parameters: `lat`, `lon` (or `search_query`)
  - Returns calculated risk scores across all 5 hazard types for the requested coordinate/city.

### 3. Official Emergency Alerts
- `GET /api/v1/official-alerts`
  - Returns active WMO CAP and GDACS official government warnings.

### 4. System & Provider Health
- `GET /api/v1/sources/status`
  - Returns real-time health status, last success timestamp, latency, and error counts for all data adapters.
- `GET /api/v1/health`
  - Liveness and readiness health checks.

### 5. Machine Learning & Models
- `GET /api/v1/models`
- `GET /api/v1/models/{model_name}/metrics`
  - Returns training metrics, ROC-AUC, calibration error, and deployment state.

## WebSockets
- `WS /ws/v1/events`
  - Real-time event stream emitting new seismic observations, flood risk updates, and emergency warnings.
