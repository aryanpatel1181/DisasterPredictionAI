# Security Architecture - TerraGuard AI

## 1. Threat Model & Safeguards

### 1.1 External Data Validation
- All external HTTP responses (USGS, GDACS, WMO CAP) undergo schema validation using Pydantic v2 before storage or downstream processing.
- XML parsing (CAP feeds) uses defusedxml to prevent XML Entity Expansion (xxe) and Bomb attacks.

### 1.2 Injection Prevention
- SQL Queries use SQLAlchemy ORM parameter binding exclusively to prevent SQL injection.
- GeoJSON geometry inputs are validated against strict spatial bounds ($[-180, 180]$ longitude, $[-90, 90]$ latitude).

### 1.3 SSRF & Host Protections
- Provider adapters restrict requests to whitelisted domain endpoints.
- API keys and secrets are loaded strictly from environment variables and never logged or committed.

### 1.4 Rate Limiting & CORS
- API endpoints are protected by sliding-window rate limiters.
- CORS origins are explicitly configured in `.env`.
